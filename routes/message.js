const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const chatController = require("../controllers/chat");
const messageController = require("../controllers/message");

router.get("/:msgId", authMiddleware, messageController.getChat);
router.post("/postIdSocket", authMiddleware, chatController.postIdSocket);
router.post("/send-message", authMiddleware, messageController.getSendMessage);
module.exports = router;
