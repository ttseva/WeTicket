const express = require("express");

const bookingsController = require("./bookings.controller");
const { authenticate } = require("../../common/middlewares/authenticate");

const router = express.Router();

router.use(authenticate);
router.post("/", bookingsController.createBooking);
router.get("/:bookingId", bookingsController.getBooking);
router.delete("/:bookingId", bookingsController.cancelBooking);
router.post("/:bookingId/pay", bookingsController.payBooking);

module.exports = router;
