const { prisma } = require("../../database/client");
const { HttpError } = require("../../common/errors/http-error");

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

async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

function validateUpdateBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
  const hasAtLeastOne = ["firstName", "lastName", "phone"].some((key) => body[key] !== undefined);
  if (!hasAtLeastOne) {
    throw new HttpError(400, "At least one of firstName, lastName, phone must be provided");
  }
}

async function updateCurrentUser(req, res, next) {
  try {
    validateUpdateBody(req.body);

    const data = {};
    if (req.body.firstName !== undefined) {
      data.firstName = String(req.body.firstName).trim();
    }
    if (req.body.lastName !== undefined) {
      data.lastName = String(req.body.lastName).trim();
    }
    if (req.body.phone !== undefined) {
      data.phone = req.body.phone ? String(req.body.phone).trim() : null;
    }

    const user = await prisma.user.update({
      where: { id: req.auth.userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const where = { userId: req.auth.userId };
    if (status) {
      where.status = status;
    }

    const [rows, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { event: true },
      }),
      prisma.booking.count({ where }),
    ]);

    const bookings = rows.map((booking) => ({
      id: booking.id,
      event: mapEvent(booking.event),
      totalAmount: Number(booking.totalAmount),
      status: booking.status,
      createdAt: booking.createdAt,
      expiresAt: booking.expiresAt,
    }));

    res.status(200).json({
      bookings,
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

module.exports = { getCurrentUser, updateCurrentUser, getMyBookings };
