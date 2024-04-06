const multer = require("multer");
const express = require("express");
const router = express.Router();
const authMiddleWare = require("../middleware/auth");
const userController = require("../controllers/user");
const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/login", userController.postLogin);
router.get("/get-user/:userId", userController.getUser);
router.post("/new-password", userController.newPassword);
router.get("/get-admin", authMiddleWare, userController.getAdmin);
router.get("/friends", authMiddleWare, userController.getFriends);
router.get("/get-avatar", authMiddleWare, userController.getAvatar);
router.get("/chat-list", authMiddleWare, userController.getChatList);
router.post("/add-friend", authMiddleWare, userController.addFriends);
router.get("/get-all-user", authMiddleWare, userController.getAllUser);
router.post("/register", upload.any("file"), userController.createUser);
router.post("/delete-friend", authMiddleWare, userController.deleteFriend);
router.post("/change-new-name", authMiddleWare, userController.changeName);
router.post("/change-password", authMiddleWare, userController.changePassword);
router.get("/search-user/:userName", authMiddleWare, userController.searchUser);
router.post(
  "/save-avatar",
  upload.any("file"),
  authMiddleWare,
  userController.changeAvatar
);
router.post(
  "/add-friend-access",
  authMiddleWare,
  userController.accessAddFriend
);
router.post(
  "/add-friend-refuse",
  authMiddleWare,
  userController.refuseAddFriend
);
module.exports = router;
