const express = require("express");

const router = express.Router();

/**
 * Base API route to verify v1 prefix is mounted.
 * @route GET /v1
 * @group System - Service and diagnostics
 * @returns {{message: string}} 200 - API entrypoint message
 */
router.get("/", (req, res) => {
  res.status(200).json({
    message: "TicketBooking API v1 is initialized",
  });
});

module.exports = router;
