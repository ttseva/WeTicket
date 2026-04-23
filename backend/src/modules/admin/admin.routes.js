const express = require("express");

const { authenticate } = require("../../common/middlewares/authenticate");
const { authorizeRoles } = require("../../common/middlewares/authorize-roles");
const adminController = require("./admin.controller");

const router = express.Router();

router.use(authenticate, authorizeRoles(["admin"]));
router.get("/ping", (req, res) => {
  res.status(200).json({ message: "Admin access granted" });
});
router.post("/events", adminController.createEvent);
router.post("/events/:eventId/seats", adminController.uploadSeats);
router.post("/events/:eventId/cancel", adminController.cancelEvent);
router.get("/statistics", adminController.getStatistics);

module.exports = router;
