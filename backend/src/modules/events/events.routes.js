const express = require("express");

const eventsController = require("./events.controller");

const router = express.Router();

router.get("/", eventsController.listEvents);
router.get("/:eventId", eventsController.getEventById);
router.get("/:eventId/seats", eventsController.getEventSeats);

module.exports = router;
