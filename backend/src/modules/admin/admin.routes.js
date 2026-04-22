const express = require("express");

const { authenticate } = require("../../common/middlewares/authenticate");
const { authorizeRoles } = require("../../common/middlewares/authorize-roles");

const router = express.Router();

router.get(
  "/ping",
  authenticate,
  authorizeRoles(["admin"]),
  (req, res) => {
    res.status(200).json({ message: "Admin access granted" });
  }
);

module.exports = router;
