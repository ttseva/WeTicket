const { HttpError } = require("../../common/errors/http-error");
const groupsService = require("./groups.service");

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
}

async function createGroupSession(req, res, next) {
  try {
    validateCreateBody(req.body);
    const result = await groupsService.createGroupSession(req.auth.userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getMyGroupSessions(req, res, next) {
  try {
    const result = await groupsService.getMyGroupSessions(req.auth.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function joinGroupByInvite(req, res, next) {
  try {
    const result = await groupsService.getSessionByInviteLink(req.params.inviteLink);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getGroupSession(req, res, next) {
  try {
    const result = await groupsService.getGroupSessionDetails(req.auth.userId, req.params.sessionId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGroupSession,
  getMyGroupSessions,
  joinGroupByInvite,
  getGroupSession,
};
