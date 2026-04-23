const express = require("express");

const ticketsController = require("./tickets.controller");
const { authenticate } = require("../../common/middlewares/authenticate");

const router = express.Router();

router.use(authenticate);
router.get("/:ticketId", ticketsController.getTicket);
router.post("/validate", ticketsController.validateTicket);

module.exports = router;
