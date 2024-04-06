const User = require("../model/user");
const upload = require("../utils/upload");
const Messages = require("../model/messages");

exports.postIdSocket = async (req, res) => {
  const id = req.body.id;
  const user = await User.findById(req.userId);
  console.log(id);
  user.idSocket = id;
  await user
    .save()
    .then((result) => {
      res.status(200).json({ msg: "Success" });
    })
    .catch((err) => {
      res.status(500).json({ msg: "some thing wrong!" });
    });
};
//save id socket
exports.saveIdSocket = async (userName, idSocket) => {
  const user = await User.findOne({ userName: userName });
  user.idSocket = idSocket;
  user.connecting = {
    status: true,
    time_out_of: "connecting",
  };
  await user
    .save()
    .then((result) => {
      // console.log("save a id socket success");
    })
    .catch((err) => {
      console.log(err);
    });
};

//save the message
exports.saveMessage = async (idChat, _id, msg, type) => {
  const message = await Messages.findById(idChat).populate({
    path: "users",
    populate: { path: "_id" },
  });
  message.createAt = new Date();

  for (let i = 0; i < message.users.length; i++) {
    if (message.users[i]._id._id.toString() === _id) {
      message.users[i].seen = true;
      continue;
    }
    message.users[i].seen = false;
  }
  message.messages.push({
    type: type,
    sender: _id,
    message: msg,
    createAt: new Date(),
  });
  await message.save();

  const idSockets = message.users
    .filter((u) => u._id._id.toString() !== _id)
    .map((u) => u._id.idSocket.toString());

  return idSockets;
};

exports.onSocket = async (socket, req, res) => {
  const id = req.body.id;
  const user = await User.findById();

  user.idSocket = id;
  await user
    .save()
    .then((result) => {
      res.status(200).json({ msg: "Success" });
    })
    .catch((err) => {
      res.status(500).json({ msg: "some thing wrong!" });
    });
};

//save image message
exports.saveImages = async (file, _id) => {
  const link = await upload.upload(file);

  const message = await Messages.findById(file.idChat).populate({
    path: "users",
    populate: { path: "_id" },
  });
  message.createAt = new Date();
  for (let i = 0; i < message.users.length; i++) {
    if (message.users[i]._id._id.toString() === _id) {
      message.users[i].seen = true;
      continue;
    }
    message.users[i].seen = false;
  }

  message.messages.push({
    type: "image",
    sender: _id,
    message: link,
    createAt: new Date(),
  });
  await message.save();

  const idSockets = message.users
    .filter((u) => u._id._id.toString() !== _id)
    .map((u) => u._id.idSocket.toString());

  return idSockets;
};

//disconnected user
exports.disConnectedUser = async (userName) => {
  const user = await User.findOne({ userName: userName });
  user.connecting = {
    status: false,
    time_out_of: new Date(),
  };
  user.timeOfAccess.timeLogout = new Date();
  user.timeOfAccess.totalTime =
    (new Date() - new Date(user.timeOfAccess.timeLogin)) / (60 * 60 * 1000);

  await user
    .save()
    .then((result) => {})
    .catch((err) => {
      console.log(err);
    });
};
