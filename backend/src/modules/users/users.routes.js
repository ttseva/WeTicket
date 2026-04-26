const express = require("express");

const usersController = require("./users.controller");
const { authenticate } = require("../../common/middlewares/authenticate");

const router = express.Router();

router.get("/me", authenticate, usersController.getCurrentUser);
router.put("/me", authenticate, usersController.updateCurrentUser);
router.get("/me/bookings", authenticate, usersController.getMyBookings);

module.exports = router;
