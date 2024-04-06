const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const emailAuthenticationController = require("../controllers/emailAuthentication");
router.post("/send-otp", emailAuthenticationController.emailAuth);
router.post("/validate-otp", emailAuthenticationController.postOTP);
router.post(
  "/send-otp-register",
  emailAuthenticationController.sendOTPRegister,
  emailAuthenticationController.emailAuth
);
router.post(
  "/send-otp-forgot-password",
  emailAuthenticationController.otpPassword
);
router.post(
  "/send-otp-forgot-password-admin",
  adminController.forgotPasswordAuth,
  emailAuthenticationController.otpPassword
);

module.exports = router;
