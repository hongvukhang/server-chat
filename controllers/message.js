const Messages = require("../model/messages");
const User = require("../model/user");

//get chat
exports.getChat = async (req, res) => {
  const msgId = req.params.msgId;
  const message = await Messages.findById(msgId);
  const data = {
    receiver:
      message.idUser1._id.toString() === req.userId.toString()
        ? message.idUser2._id
        : message.idUser1._id,
    messages: message.messages,
  };
  if (message.idUser1._id.toString() === req.userId.toString()) {
    message.idUser2.seen = true;
  } else {
    message.idUser1.seen = true;
  }
  await message.save();
  const user = await User.findById(data.receiver);

  res.status(200).json({
    ...data,
    avatar: user.avatar,
    userName: user.name ? user.name : user.userName,
  });
};

// send message
exports.getSendMessage = async (req, res) => {
  const user_friend = req.params.userId;
  const userId = req.userId;
  const user1 = await User.findById(userId);
  const user2 = await User.findById(user_friend);
  const exist = user1.msgs.filter((msg) => user2.msgs.includes(msg));

  if (exist.length > 0) {
    res.status(200).json(exist[0]);
  } else {
    const msg = new Messages({
      idUser1: { _id: userId, seen: true },
      idUser2: { _id: user_friend, seen: true },
      createAt: new Date(),
      messages: [],
    });
    await msg.save().then(async (result) => {
      user1.msgs.push(result._id);
      user2.msgs.push(result._id);
      await user1.save();
      await user2.save();
      res.status(200).json(result._id);
    });
  }
};
