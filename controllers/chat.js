const Messages = require("../model/messages");
const User = require("../model/user");
const upload = require("../utils/upload");
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
exports.saveMessage = async (idChat, receiver_id, msg, type) => {
  const message = await Messages.findById(idChat);
  message.createAt = new Date();
  if (receiver_id.toString() === message.idUser1._id.toString()) {
    message.idUser2.seen = false;
    message.idUser1.seen = true;
  } else {
    message.idUser2.seen = true;
    message.idUser1.seen = false;
  }

  message.messages.push({
    type: type,
    sender:
      receiver_id.toString() === message.idUser1._id.toString()
        ? message.idUser2._id
        : message.idUser1._id,
    message: msg,
    createAt: new Date(),
  });
  await message.save();

  const user = await User.findById(receiver_id);

  return user.idSocket;
};

exports.onSocket = async (socket, req, res) => {
  const id = req.body.id;
  const user = await User.findById();
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

//save image message
exports.saveImages = async (file) => {
  const link = await upload.upload(file);

  const message = await Messages.findById(file.idChat);
  message.createAt = new Date();
  if (file.receiver_id.toString() === message.idUser1._id.toString()) {
    message.idUser2.seen = false;
    message.idUser1.seen = true;
  } else {
    message.idUser2.seen = true;
    message.idUser1.seen = false;
  }

  message.messages.push({
    type: "image",
    sender:
      file.receiver_id.toString() === message.idUser1._id.toString()
        ? message.idUser2._id
        : message.idUser1._id,
    message: link,
    createAt: new Date(),
  });
  await message.save();

  const user = await User.findById(file.receiver_id);

  return user.idSocket;
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
