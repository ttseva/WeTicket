const { HttpError } = require("../../common/errors/http-error");
const adminService = require("./admin.service");

function ensureBodyObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
}

function validateCreateEventBody(body) {
  ensureBodyObject(body);
  const required = ["title", "description", "category", "dateTime", "venue", "address"];
  for (const field of required) {
    if (!body[field]) {
      throw new HttpError(400, `Field '${field}' is required`);
    }
  }
}

function validateUploadSeatsBody(body) {
  ensureBodyObject(body);
  if (body.rows === undefined || body.seatsPerRow === undefined) {
    throw new HttpError(400, "Fields 'rows' and 'seatsPerRow' are required");
  }
}

async function createEvent(req, res, next) {
  try {
    validateCreateEventBody(req.body);
    const result = await adminService.createEvent(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateEvent(req, res, next) {
  try {
    ensureBodyObject(req.body);
    const result = await adminService.updateEvent(req.params.eventId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function uploadSeats(req, res, next) {
  try {
    validateUploadSeatsBody(req.body);
    await adminService.uploadSeats(req.params.eventId, req.body);
    res.status(200).json({ message: "Seat map uploaded successfully" });
  } catch (error) {
    next(error);
  }
}

async function cancelEvent(req, res, next) {
  try {
    const result = await adminService.cancelEvent(req.params.eventId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getStatistics(req, res, next) {
  try {
    const result = await adminService.getStatistics({
      period: req.query.period,
      eventId: req.query.eventId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  updateEvent,
  uploadSeats,
  cancelEvent,
  getStatistics,
};
