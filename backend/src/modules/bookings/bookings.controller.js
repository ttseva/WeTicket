const bookingsService = require("./bookings.service");
const { HttpError } = require("../../common/errors/http-error");

function ensureBodyObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
}

function validateCreateBody(body) {
  ensureBodyObject(body);
  if (!body.eventId || typeof body.eventId !== "string") {
    throw new HttpError(400, "Field 'eventId' is required");
  }
  if (!Array.isArray(body.seatIds) || body.seatIds.length === 0) {
    throw new HttpError(400, "Field 'seatIds' must be a non-empty array");
  }
  if (!body.seatIds.every((id) => typeof id === "string")) {
    throw new HttpError(400, "Every seat id must be a string");
  }
  if (body.groupSessionId !== undefined && typeof body.groupSessionId !== "string") {
    throw new HttpError(400, "Field 'groupSessionId' must be a string");
  }
}

function validatePayBody(body) {
  ensureBodyObject(body);
  if (!body.paymentMethod || typeof body.paymentMethod !== "string") {
    throw new HttpError(400, "Field 'paymentMethod' is required");
  }
  if (!["card", "wallet"].includes(body.paymentMethod)) {
    throw new HttpError(400, "Unsupported payment method");
  }
}

async function createBooking(req, res, next) {
  try {
    validateCreateBody(req.body);
    const result = await bookingsService.createBooking(req.auth.userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getBooking(req, res, next) {
  try {
    const result = await bookingsService.getBookingById(req.auth.userId, req.params.bookingId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    await bookingsService.cancelBooking(req.auth.userId, req.params.bookingId);
    res.status(200).json({ message: "Booking cancelled" });
  } catch (error) {
    next(error);
  }
}

async function payBooking(req, res, next) {
  try {
    validatePayBody(req.body);
    const result = await bookingsService.payBooking(
      req.auth.userId,
      req.params.bookingId,
      req.body.paymentMethod,
      req.body.cardToken
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  getBooking,
  cancelBooking,
  payBooking,
};
