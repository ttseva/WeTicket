const { prisma } = require("../../database/client");
const { HttpError } = require("../../common/errors/http-error");
const paymentGateway = require("../../integrations/payment/payment-gateway.mock");
const ticketsService = require("../tickets/tickets.service");

const BOOKING_TTL_MINUTES = 15;

function mapEvent(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    dateTime: event.dateTime,
    duration: event.duration,
    venue: event.venue,
    address: event.address,
    minAge: event.minAge,
    posterUrl: event.posterUrl,
    status: event.status,
  };
}

function bookingExpiresAt() {
  return new Date(Date.now() + BOOKING_TTL_MINUTES * 60 * 1000);
}

async function assertClientCanBook(tx, userId) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.role === "admin" || user.role === "organizer") {
    throw new HttpError(403, "Organizers and admins cannot book seats");
  }
}

async function createBooking(userId, payload) {
  const { eventId, seatIds, groupSessionId } = payload;
  const uniqueSeatIds = [...new Set(seatIds)];
  const expiresAt = bookingExpiresAt();
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    await assertClientCanBook(tx, userId);

    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new HttpError(404, "Event not found");
    }
    if (event.status !== "active") {
      throw new HttpError(422, "Event is not available for booking");
    }

    await tx.seat.updateMany({
      where: {
        eventId,
        status: "blocked",
        lockedUntil: { lte: now },
      },
      data: {
        status: "free",
        lockedUntil: null,
      },
    });

    const seats = await tx.seat.findMany({
      where: {
        id: { in: uniqueSeatIds },
        eventId,
      },
    });

    if (seats.length !== uniqueSeatIds.length) {
      throw new HttpError(400, "Some seats are invalid for this event");
    }

    let blockWhere = {
      id: { in: uniqueSeatIds },
      eventId,
    };

    if (groupSessionId) {
      const groupSession = await tx.groupSession.findUnique({
        where: { id: groupSessionId },
      });
      if (!groupSession) {
        throw new HttpError(404, "Group session not found");
      }
      if (groupSession.eventId !== eventId) {
        throw new HttpError(400, "Group session does not match event");
      }
      if (groupSession.status !== "active" || groupSession.expiresAt <= now) {
        throw new HttpError(422, "Group session is not active");
      }

      const validGroupSeats = seats.filter(
        (seat) => seat.status === "group_blocked" && seat.groupSessionId === groupSessionId
      );
      if (validGroupSeats.length !== uniqueSeatIds.length) {
        throw new HttpError(409, "Some seats are not available in this group session");
      }

      blockWhere = {
        ...blockWhere,
        status: "group_blocked",
        groupSessionId,
      };
    } else {
      const availableSeatIds = seats
        .filter((seat) => seat.status === "free")
        .map((seat) => seat.id);
      if (availableSeatIds.length !== uniqueSeatIds.length) {
        throw new HttpError(409, "Some seats are already occupied");
      }
      blockWhere = {
        ...blockWhere,
        status: "free",
      };
    }

    const blockResult = await tx.seat.updateMany({
      where: blockWhere,
      data: {
        status: "blocked",
        lockedUntil: expiresAt,
      },
    });

    if (blockResult.count !== uniqueSeatIds.length) {
      throw new HttpError(409, "Some seats were booked by another user");
    }

    const totalAmount = seats.reduce((sum, seat) => sum + Number(seat.price), 0);
    const booking = await tx.booking.create({
      data: {
        userId,
        eventId,
        groupSessionId: groupSessionId || null,
        totalAmount,
        status: "pending",
        expiresAt,
      },
    });

    await tx.bookingItem.createMany({
      data: seats.map((seat) => ({
        bookingId: booking.id,
        seatId: seat.id,
        priceAtBooking: seat.price,
      })),
    });

    return {
      bookingId: booking.id,
      status: booking.status,
      expiresAt: booking.expiresAt,
      totalAmount: Number(booking.totalAmount),
      paymentUrl: `/v1/bookings/${booking.id}/pay`,
    };
  }, {
    maxWait: 10000,
    timeout: 15000,
  });
}

async function getBookingById(userId, bookingId) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { event: true },
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  return {
    id: booking.id,
    event: mapEvent(booking.event),
    totalAmount: Number(booking.totalAmount),
    status: booking.status,
    createdAt: booking.createdAt,
    expiresAt: booking.expiresAt,
  };
}

async function cancelBooking(userId, bookingId) {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, userId },
      include: { items: true },
    });

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }
    if (booking.status !== "pending") {
      throw new HttpError(422, "Only pending booking can be cancelled");
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled" },
    });

    const groupSession =
      booking.groupSessionId
        ? await tx.groupSession.findUnique({ where: { id: booking.groupSessionId } })
        : null;

    if (
      groupSession &&
      groupSession.status === "active" &&
      groupSession.expiresAt > new Date()
    ) {
      await tx.seat.updateMany({
        where: { id: { in: booking.items.map((item) => item.seatId) } },
        data: {
          status: "group_blocked",
          groupSessionId: groupSession.id,
          lockedUntil: groupSession.expiresAt,
        },
      });
    } else {
      await tx.seat.updateMany({
        where: { id: { in: booking.items.map((item) => item.seatId) } },
        data: {
          status: "free",
          groupSessionId: null,
          lockedUntil: null,
        },
      });
    }
  });
}

async function payBooking(userId, bookingId, paymentMethod, cardToken) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, userId },
      include: {
        items: { include: { seat: true } },
      },
    });

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }
    if (booking.status !== "pending") {
      throw new HttpError(422, "Booking is not pending");
    }
    if (booking.expiresAt <= now) {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "expired" },
      });
      await tx.seat.updateMany({
        where: { id: { in: booking.items.map((item) => item.seatId) } },
        data: {
          status: "free",
          lockedUntil: null,
        },
      });
      throw new HttpError(422, "Booking has expired");
    }

    const paymentResult = await paymentGateway.charge({
      amount: Number(booking.totalAmount),
      paymentMethod,
      cardToken,
    });

    if (!paymentResult.ok) {
      await tx.payment.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          paymentMethod,
          transactionId: paymentResult.transactionId,
          status: "failed",
          processedAt: now,
        },
        update: {
          paymentMethod,
          transactionId: paymentResult.transactionId,
          status: "failed",
          processedAt: now,
        },
      });
      throw new HttpError(422, paymentResult.message || "Payment failed", {
        code: paymentResult.errorCode || "payment_failed",
      });
    }

    await tx.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        paymentMethod,
        transactionId: paymentResult.transactionId,
        status: "success",
        processedAt: now,
      },
      update: {
        paymentMethod,
        transactionId: paymentResult.transactionId,
        status: "success",
        processedAt: now,
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "paid",
        paidAt: now,
      },
    });

    if (booking.groupSessionId) {
      const paidCount = await tx.booking.count({
        where: {
          groupSessionId: booking.groupSessionId,
          status: "paid",
        },
      });
      const session = await tx.groupSession.findUnique({
        where: { id: booking.groupSessionId },
      });
      if (session) {
        await tx.groupSession.update({
          where: { id: session.id },
          data: {
            participantsCount: paidCount,
            status: paidCount >= session.totalSeats ? "completed" : session.status,
          },
        });
      }
    }

    await tx.seat.updateMany({
      where: { id: { in: booking.items.map((item) => item.seatId) } },
      data: {
        status: "sold",
        lockedUntil: null,
      },
    });

    await ticketsService.issueTicketsForBookingItems(tx, booking.items);

    const tickets = await tx.ticket.findMany({
      where: { bookingItemId: { in: booking.items.map((item) => item.id) } },
      include: { bookingItem: true },
    });

    return {
      bookingId: booking.id,
      status: "paid",
      paidAt: now,
      tickets: tickets.map((ticket) => ({
        ticketId: ticket.id,
        seatId: ticket.bookingItem.seatId,
        qrCode: ticket.qrCode,
      })),
    };
  }, {
    maxWait: 10000,
    timeout: 15000,
  });
}

module.exports = {
  createBooking,
  getBookingById,
  cancelBooking,
  payBooking,
};
