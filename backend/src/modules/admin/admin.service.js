const { prisma } = require("../../database/client");
const { HttpError } = require("../../common/errors/http-error");

const EVENT_CATEGORIES = ["theatre", "cinema", "concert", "conference"];

function parseSeatLabel(label) {
  const [rowRaw, seatRaw] = String(label).split("-");
  const row = Number(rowRaw);
  const seat = Number(seatRaw);
  if (!Number.isInteger(row) || !Number.isInteger(seat)) {
    return null;
  }
  return `${row}-${seat}`;
}

async function createEvent(payload) {
  if (!EVENT_CATEGORIES.includes(payload.category)) {
    throw new HttpError(400, "Invalid event category");
  }

  const event = await prisma.event.create({
    data: {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      dateTime: new Date(payload.dateTime),
      duration: payload.duration || 120,
      venue: payload.venue,
      address: payload.address,
      city: payload.city || null,
      minAge: payload.minAge || 0,
      posterUrl: payload.posterUrl || null,
      status: "active",
    },
  });

  return {
    eventId: event.id,
    status: event.status,
    message: "Event created successfully",
  };
}

async function uploadSeats(eventId, payload) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new HttpError(404, "Event not found");
  }

  const rows = Number(payload.rows);
  const seatsPerRow = Number(payload.seatsPerRow);
  if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(seatsPerRow) || seatsPerRow < 1) {
    throw new HttpError(400, "rows and seatsPerRow must be positive integers");
  }

  const existingBookings = await prisma.booking.count({ where: { eventId } });
  if (existingBookings > 0) {
    throw new HttpError(422, "Cannot re-upload seats after bookings were created");
  }

  const rowPriceMap = payload.priceMap || {};
  const vipSet = new Set((payload.vipSeats || []).map(parseSeatLabel).filter(Boolean));

  const seats = [];
  for (let row = 1; row <= rows; row += 1) {
    const rowPrice = Number(rowPriceMap[String(row)]) || 1000;
    for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber += 1) {
      const seatLabel = `${row}-${seatNumber}`;
      const isVip = vipSet.has(seatLabel);
      seats.push({
        eventId,
        rowNumber: row,
        seatNumber,
        price: isVip ? rowPrice * 1.5 : rowPrice,
        status: "free",
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.seat.deleteMany({ where: { eventId } });
    await tx.seat.createMany({ data: seats });
  });
}

async function updateEvent(eventId, payload) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new HttpError(404, "Event not found");
  }
  if (event.status === "cancelled") {
    throw new HttpError(422, "Cancelled event cannot be edited");
  }

  const data = {};
  if (payload.title !== undefined) {
    data.title = payload.title;
  }
  if (payload.description !== undefined) {
    data.description = payload.description;
  }
  if (payload.category !== undefined) {
    if (!EVENT_CATEGORIES.includes(payload.category)) {
      throw new HttpError(400, "Invalid event category");
    }
    data.category = payload.category;
  }
  if (payload.dateTime !== undefined) {
    data.dateTime = new Date(payload.dateTime);
  }
  if (payload.duration !== undefined) {
    data.duration = Number(payload.duration);
  }
  if (payload.venue !== undefined) {
    data.venue = payload.venue;
  }
  if (payload.address !== undefined) {
    data.address = payload.address;
  }
  if (payload.city !== undefined) {
    data.city = payload.city;
  }
  if (payload.minAge !== undefined) {
    data.minAge = Number(payload.minAge);
  }
  if (payload.posterUrl !== undefined) {
    data.posterUrl = payload.posterUrl;
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data,
  });

  return {
    eventId: updated.id,
    status: updated.status,
    message: "Event updated successfully",
  };
}

async function cancelEvent(eventId) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new HttpError(404, "Event not found");
    }

    await tx.event.update({
      where: { id: eventId },
      data: { status: "cancelled" },
    });

    const paidBookings = await tx.booking.findMany({
      where: { eventId, status: "paid" },
      select: { id: true },
    });

    if (paidBookings.length > 0) {
      const bookingIds = paidBookings.map((item) => item.id);
      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: "refunded" },
      });
      await tx.payment.updateMany({
        where: { bookingId: { in: bookingIds } },
        data: {
          status: "refunded",
          processedAt: new Date(),
        },
      });
    }

    await tx.seat.updateMany({
      where: { eventId },
      data: {
        status: "free",
        lockedUntil: null,
        groupSessionId: null,
      },
    });

    return {
      message: "Event cancelled successfully",
      affectedBookings: paidBookings.length,
      refundInitiated: paidBookings.length > 0,
    };
  });
}

function periodStart(period) {
  const now = new Date();
  const map = { week: 7, month: 30, year: 365 };
  const days = map[period] || 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

async function getStatistics({ period = "month", eventId }) {
  const createdAtFilter = { gte: periodStart(period) };
  const bookingWhere = { createdAt: createdAtFilter };
  if (eventId) {
    bookingWhere.eventId = eventId;
  }

  const bookings = await prisma.booking.findMany({
    where: bookingWhere,
    include: { event: true },
  });

  const summary = {
    totalBookings: bookings.length,
    paidBookings: bookings.filter((b) => b.status === "paid").length,
    refundedBookings: bookings.filter((b) => b.status === "refunded").length,
    revenue: bookings
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + Number(b.totalAmount), 0),
  };

  const byCategoryMap = new Map();
  for (const booking of bookings.filter((b) => b.status === "paid")) {
    const key = booking.event.category;
    const existing = byCategoryMap.get(key) || { category: key, count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += Number(booking.totalAmount);
    byCategoryMap.set(key, existing);
  }

  const byEventMap = new Map();
  for (const booking of bookings.filter((b) => b.status === "paid")) {
    const key = booking.eventId;
    const existing = byEventMap.get(key) || {
      eventId: key,
      title: booking.event.title,
      sold: 0,
      revenue: 0,
    };
    existing.sold += 1;
    existing.revenue += Number(booking.totalAmount);
    byEventMap.set(key, existing);
  }

  return {
    summary,
    salesByCategory: Array.from(byCategoryMap.values()),
    topEvents: Array.from(byEventMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
  };
}

module.exports = {
  createEvent,
  updateEvent,
  uploadSeats,
  cancelEvent,
  getStatistics,
};
