const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageGroupSchema = new Schema({
  // _id: { type: mongoose.Types.ObjectId, require: true },
  users: [
    {
      _id: { type: mongoose.Types.ObjectId, require: true, ref: "Users" },
      seen: { type: Boolean, require: true },
    },
  ],
  createAt: { type: String, require: true },
  messages: [
    {
      type: { type: String, require: true },
      sender: { type: mongoose.Types.ObjectId, require: true },
      message: { type: String, require: true },
      createAt: { type: String, require: true },
    },
  ],
});

module.exports = mongoose.model("Messages", messageGroupSchema);
