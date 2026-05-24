const crypto = require("crypto");

const { prisma } = require("../../database/client");
const { HttpError } = require("../../common/errors/http-error");

function buildInviteLink() {
  return crypto.randomBytes(12).toString("hex");
}

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

function mapSeat(seat) {
  return {
    seatId: seat.id,
    row: seat.rowNumber,
    number: seat.seatNumber,
    sector: seat.sector,
    price: Number(seat.price),
    status: seat.status,
  };
}

async function createGroupSession(leaderId, payload) {
  const { eventId, seatIds } = payload;
  const uniqueSeatIds = [...new Set(seatIds)];
  const expiresInHours = Number(payload.expiresInHours) || 48;
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  if (uniqueSeatIds.length < 3 || uniqueSeatIds.length > 20) {
    throw new HttpError(400, "Group block must contain between 3 and 20 seats");
  }

  return prisma.$transaction(async (tx) => {
    const leader = await tx.user.findUnique({ where: { id: leaderId }, select: { role: true } });
    if (!leader) {
      throw new HttpError(404, "User not found");
    }
    if (leader.role === "admin" || leader.role === "organizer") {
      throw new HttpError(403, "Organizers and admins cannot book seats");
    }

    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new HttpError(404, "Event not found");
    }
    if (event.status !== "active") {
      throw new HttpError(422, "Event is not available for group purchase");
    }

    const seats = await tx.seat.findMany({
      where: { id: { in: uniqueSeatIds }, eventId },
    });
    if (seats.length !== uniqueSeatIds.length) {
      throw new HttpError(400, "Some seats are invalid for this event");
    }
    if (seats.some((seat) => seat.status !== "free")) {
      throw new HttpError(409, "Some seats are already occupied");
    }

    const session = await tx.groupSession.create({
      data: {
        leaderId,
        eventId,
        inviteLink: buildInviteLink(),
        totalSeats: uniqueSeatIds.length,
        status: "active",
        expiresAt,
      },
    });

    const updated = await tx.seat.updateMany({
      where: { id: { in: uniqueSeatIds }, status: "free" },
      data: {
        status: "group_blocked",
        groupSessionId: session.id,
        lockedUntil: expiresAt,
      },
    });
    if (updated.count !== uniqueSeatIds.length) {
      throw new HttpError(409, "Failed to lock all seats for group session");
    }

    return {
      sessionId: session.id,
      inviteLink: session.inviteLink,
      expiresAt: session.expiresAt,
      totalSeats: session.totalSeats,
    };
  });
}

async function getMyGroupSessions(leaderId) {
  const sessions = await prisma.groupSession.findMany({
    where: { leaderId },
    include: {
      event: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    sessions: sessions.map((session) => ({
      sessionId: session.id,
      inviteLink: session.inviteLink,
      totalSeats: session.totalSeats,
      participantsCount: session.participantsCount,
      status: session.status,
      expiresAt: session.expiresAt,
      event: {
        id: session.event.id,
        title: session.event.title,
      },
    })),
  };
}

async function getSessionByInviteLink(inviteLink) {
  const session = await prisma.groupSession.findUnique({
    where: { inviteLink },
    include: {
      event: true,
      leader: true,
      seats: {
        orderBy: [{ rowNumber: "asc" }, { seatNumber: "asc" }],
      },
      bookings: {
        include: { items: true },
      },
    },
  });

  if (!session) {
    throw new HttpError(404, "Group session not found");
  }

  const bookedSeatIds = new Set(
    session.bookings.flatMap((booking) => booking.items.map((item) => item.seatId))
  );
  const assignedSeat = session.seats.find((seat) => !bookedSeatIds.has(seat.id)) || null;

  return {
    sessionId: session.id,
    event: mapEvent(session.event),
    assignedSeat: assignedSeat ? mapSeat(assignedSeat) : null,
    organizer: {
      userId: session.leader.id,
      name: `${session.leader.firstName} ${session.leader.lastName}`.trim(),
    },
    expiresAt: session.expiresAt,
  };
}

async function getGroupSessionDetails(requestUserId, sessionId) {
  const session = await prisma.groupSession.findUnique({
    where: { id: sessionId },
    include: {
      event: { select: { id: true, title: true } },
      bookings: {
        include: {
          user: true,
          items: { include: { seat: true } },
        },
      },
    },
  });

  if (!session) {
    throw new HttpError(404, "Group session not found");
  }
  if (session.leaderId !== requestUserId) {
    throw new HttpError(403, "Only session organizer can view session details");
  }

  const participants = session.bookings.map((booking) => {
    const seat = booking.items[0]?.seat;
    return {
      userId: booking.userId,
      name: `${booking.user.firstName} ${booking.user.lastName}`.trim(),
      paid: booking.status === "paid",
      seatId: booking.items[0]?.seatId || null,
      seatLabel: seat ? `ряд ${seat.rowNumber}, место ${seat.seatNumber}` : null,
    };
  });

  const paidCount = participants.filter((item) => item.paid).length;
  if (paidCount !== session.participantsCount) {
    await prisma.groupSession.update({
      where: { id: session.id },
      data: { participantsCount: paidCount },
    });
  }

  return {
    sessionId: session.id,
    inviteLink: session.inviteLink,
    event: { id: session.event.id, title: session.event.title },
    status: session.status,
    totalSeats: session.totalSeats,
    participantsCount: paidCount,
    participants,
    expiresAt: session.expiresAt,
  };
}

module.exports = {
  createGroupSession,
  getMyGroupSessions,
  getSessionByInviteLink,
  getGroupSessionDetails,
};
