const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const middleware = require("../middleware/authAdmin");

router.post("/login", adminController.postLogin);
router.post("/ban-user", middleware, adminController.isBanUser);
router.post("/set-admin", middleware, adminController.IsSetAdmin);
router.get("/get-user/:topic", middleware, adminController.getAllUser);
router.get("/total-chat", middleware, adminController.getTotalMessages);
router.delete("/delete-user/:_id", middleware, adminController.deleteUser);
module.exports = router;
