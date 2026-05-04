const { prisma } = require("../../database/client");
const { HttpError } = require("../../common/errors/http-error");

const ALLOWED_CATEGORIES = ["theatre", "cinema", "concert", "conference"];

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

function getDateBoundary(value, endOfDay = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, "Invalid date format in dateFrom/dateTo");
  }
  if (endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  } else {
    date.setUTCHours(0, 0, 0, 0);
  }
  return date;
}

function buildEventsFilter(query) {
  const where = { status: "active" };

  if (query.category) {
    if (!ALLOWED_CATEGORIES.includes(query.category)) {
      throw new HttpError(400, "Invalid category filter value");
    }
    where.category = query.category;
  }

  if (query.city) {
    where.city = { contains: String(query.city).trim(), mode: "insensitive" };
  }

  if (query.search) {
    const search = String(query.search).trim();
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { venue: { contains: search, mode: "insensitive" } },
    ];
  }

  if (query.dateFrom || query.dateTo) {
    where.dateTime = {};
    if (query.dateFrom) {
      where.dateTime.gte = getDateBoundary(query.dateFrom, false);
    }
    if (query.dateTo) {
      where.dateTime.lte = getDateBoundary(query.dateTo, true);
    }
  }

  return where;
}

function buildOrderBy(sort) {
  switch (sort) {
    case "date":
      return { dateTime: "asc" };
    case "date_desc":
      return { dateTime: "desc" };
    case "title":
      return { title: "asc" };
    default:
      return { dateTime: "asc" };
  }
}

async function listEvents(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const where = buildEventsFilter(req.query);
    const orderBy = buildOrderBy(req.query.sort || "date");

    const [rows, total] = await Promise.all([
      prisma.event.findMany({ where, orderBy, skip, take: limit }),
      prisma.event.count({ where }),
    ]);

    res.status(200).json({
      events: rows.map(mapEvent),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getEventById(req, res, next) {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
    if (!event) {
      throw new HttpError(404, "Event not found");
    }
    res.status(200).json(mapEvent(event));
  } catch (error) {
    next(error);
  }
}

async function getEventSeats(req, res, next) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.eventId },
      select: { id: true },
    });
    if (!event) {
      throw new HttpError(404, "Event not found");
    }

    const seats = await prisma.seat.findMany({
      where: { eventId: req.params.eventId },
      orderBy: [{ rowNumber: "asc" }, { seatNumber: "asc" }],
    });

    res.status(200).json({
      eventId: req.params.eventId,
      seats: seats.map(mapSeat),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listEvents, getEventById, getEventSeats };
