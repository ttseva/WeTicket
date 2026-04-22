const express = require("express");

const usersController = require("./users.controller");
const { authenticate } = require("../../common/middlewares/authenticate");

const router = express.Router();

router.get("/me", authenticate, usersController.getCurrentUser);

module.exports = router;
