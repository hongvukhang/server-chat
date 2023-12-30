const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  // _id: { type: mongoose.Types.ObjectId, require: true },
  idUser1: {
    _id: { type: mongoose.Types.ObjectId, require: true },
    seen: { type: Boolean, require: true },
  },
  idUser2: {
    _id: { type: mongoose.Types.ObjectId, require: true },
    seen: { type: Boolean, require: true },
  },

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

module.exports = mongoose.model("Messages", messageSchema);
