const express = require("express");
const router = express.Router();
const emailAuthenticationController = require("../controllers/emailAuthentication");

router.post("/send-otp", emailAuthenticationController.emailAuth);
router.post(
  "/send-otp-forgot-password",
  emailAuthenticationController.otpPassword
);
router.post("/validate-otp", emailAuthenticationController.postOTP);

module.exports = router;
