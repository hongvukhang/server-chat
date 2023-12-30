const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message");
const authMiddleware = require("../middleware/auth");
const chatController = require("../controllers/chat");

router.get("/:msgId", authMiddleware, messageController.getChat);
router.get(
  "/send-message/:userId",
  authMiddleware,
  messageController.getSendMessage
);
router.post("/postIdSocket", authMiddleware, chatController.postIdSocket);
module.exports = router;
