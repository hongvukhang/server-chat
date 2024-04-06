const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  // _id: { type: mongoose.Types.ObjectId, require: true },
  userName: { type: String, require: true },
  name: { type: String, require: true },
  password: { type: String, require: true },
  connecting: {
    status: {
      type: Boolean,
      require: true,
    },
    time_out_of: { type: String, require: true },
  },
  timeOfAccess: {
    timeLogin: { type: String, require: true },
    timeLogout: { type: String, require: true },
    totalTime: { type: Number, require: true },
  },
  baned: { type: Boolean, require: true },
  role: { type: String, require: true },
  email: { type: String, require: true },
  avatar: { type: String, require: true },
  idSocket: { type: String, require: false },
  createAt: { type: String, require: true },
  listAvatar: [{ type: String }],
  msgs: [{ type: mongoose.Types.ObjectId, ref: "Messages" }],
  friends: [
    {
      _id: { type: mongoose.Types.ObjectId, ref: "User" },
      status: { type: String },
      createAt: { type: Date },
    },
  ],
  deleted: { type: Boolean, require: false },
});

module.exports = mongoose.model("User", userSchema);
