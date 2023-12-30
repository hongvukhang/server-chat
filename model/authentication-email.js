const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const emailAuth = new Schema({
  email: { type: String, require: true },
  otp: { type: String, require: true },
  createAt: { type: String, require: true },
});
module.exports = mongoose.model("emailAuth", emailAuth);
