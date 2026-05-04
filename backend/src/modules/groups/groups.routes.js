const express = require("express");

const groupsController = require("./groups.controller");
const { authenticate } = require("../../common/middlewares/authenticate");

const router = express.Router();

router.use(authenticate);
router.post("/", groupsController.createGroupSession);
router.get("/my", groupsController.getMyGroupSessions);
router.get("/join/:inviteLink", groupsController.joinGroupByInvite);
router.get("/:sessionId", groupsController.getGroupSession);

module.exports = router;
