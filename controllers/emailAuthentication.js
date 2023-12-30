const EmailAuth = require("../model/authentication-email");
const User = require("../model/user");
const { sendEmail } = require("../utils/sendEmail");

// Random otp
function generateOTP() {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}
//send otp
async function sendOTP(res, email, subject) {
  const otp = generateOTP();
  const emailAuth = new EmailAuth({
    email: email,
    otp: otp,
    createAt: new Date(),
  });

  await emailAuth.save().then(async () => {
    const info = await sendEmail(email, otp, subject);

    res.status(200).json({ msg: "Check Email", info: info });
  });
  setTimeout(async () => {
    await EmailAuth.deleteOne({ email: email });
  }, 120000);
}

// send email otp
exports.emailAuth = async (req, res) => {
  const email = req.body.email;

  const otp = generateOTP();
  const emailAuth = new EmailAuth({
    email: email,
    otp: otp,
    createAt: new Date(),
  });

  await emailAuth.save().then(async () => {
    const info = await sendEmail(email, otp, "Register Email");
    res.status(200).json({ msg: "Check Email", info: info });
  });
  setTimeout(async () => {
    await EmailAuth.deleteOne({ email: email });
  }, 120000);
};

// get email otp forgot password
exports.otpPassword = async (req, res) => {
  const userName = req.body.userName;
  const user = await User.findOne({ userName: userName });
  if (!user) return res.status(404).json({ msg: "username not found!" });
  sendOTP(res, user.email, "Forgot Password");
};
// validate otp
exports.postOTP = async (req, res) => {
  const otp = req.body.otp;
  const email = req.body.email;
  const emailAuth = await EmailAuth.findOne({ email: email });

  if (otp === emailAuth.otp) {
    res.status(200).json({ msg: "success" });
  } else {
    res.status(408).json({ msg: "faild" });
  }
};
