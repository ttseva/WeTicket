const { HttpError } = require("../../common/errors/http-error");
const ticketsService = require("./tickets.service");

function ensureBodyObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
}

function validateQrBody(body) {
  ensureBodyObject(body);
  if (!body.qrCode || typeof body.qrCode !== "string") {
    throw new HttpError(400, "Field 'qrCode' is required");
  }
}

async function getTicket(req, res, next) {
  try {
    const result = await ticketsService.getTicketById(req.auth.userId, req.params.ticketId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function validateTicket(req, res, next) {
  try {
    validateQrBody(req.body);
    const result = await ticketsService.validateQrCode(req.body.qrCode);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { getTicket, validateTicket };
