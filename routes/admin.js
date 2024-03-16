const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const middleware = require("../middleware/authAdmin");

router.post("/login", adminController.postLogin);
router.get("/get-user/:topic", middleware, adminController.getAllUser);
router.post("/set-admin", middleware, adminController.IsSetAdmin);
router.post("/ban-user", middleware, adminController.isBanUser);
router.delete("/delete-user/:_id", middleware, adminController.deleteUser);
router.get("/total-chat", middleware, adminController.getTotalMessages);
module.exports = router;
