const express = require("express");
const authRoutes = require("../../modules/auth/auth.routes");
const usersRoutes = require("../../modules/users/users.routes");
const adminRoutes = require("../../modules/admin/admin.routes");

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
router.use("/admin", adminRoutes);

module.exports = router;
