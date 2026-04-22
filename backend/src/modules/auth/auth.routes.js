const express = require("express");

const authController = require("./auth.controller");
const { authenticate } = require("../../common/middlewares/authenticate");
const { authLimiter } = require("../../http/middlewares/rate-limiters");

const router = express.Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authenticate, authController.logout);

module.exports = router;
