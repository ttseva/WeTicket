const express = require("express");
const authRoutes = require("../../modules/auth/auth.routes");
const usersRoutes = require("../../modules/users/users.routes");
const adminRoutes = require("../../modules/admin/admin.routes");
const bookingsRoutes = require("../../modules/bookings/bookings.routes");
const eventsRoutes = require("../../modules/events/events.routes");
const ticketsRoutes = require("../../modules/tickets/tickets.routes");
const groupsRoutes = require("../../modules/groups/groups.routes");

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

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/events", eventsRoutes);
router.use("/groups", groupsRoutes);
router.use("/tickets", ticketsRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
