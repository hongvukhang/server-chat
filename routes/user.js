const express = require("express");
const multer = require("multer");
const router = express.Router();
const userController = require("../controllers/user");
const authMiddleWare = require("../middleware/auth");
const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/register", upload.any("file"), userController.createUser);

router.post("/login", userController.postLogin);
router.get("/chat-list", authMiddleWare, userController.getChatList);
router.get("/get-user/:userId", userController.getUser);
router.get("/search-user/:userName", authMiddleWare, userController.searchUser);
router.post("/change-new-name", authMiddleWare, userController.changeName);
router.get("/get-avatar", authMiddleWare, userController.getAvatar);
router.post(
  "/save-avatar",
  upload.any("file"),
  authMiddleWare,
  userController.changeAvatar
);
router.post("/new-password", userController.newPassword);
module.exports = router;
