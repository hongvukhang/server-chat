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

  const message = await Messages.find();

  const messageFilter = message.filter((user) => {
    return (
      (user.idUser1.toString() === userId.toString() ||
        user.idUser1.toString() === user_friend.toString()) &&
      (user.idUser2.toString() === userId.toString() ||
        user.idUser2.toString() === user_friend.toString())
    );
  });

  if (messageFilter.length > 0) {
    res.status(200).json(messageFilter[0]._id);
  } else {
    const msg = new Messages({
      idUser1: { _id: userId, seen: true },
      idUser2: { _id: user_friend, seen: true },
      createAt: new Date(),
      messages: [],
    });
    await msg.save().then(async (result) => {
      const user = await User.findById(userId);
      const userF = await User.findById(user_friend);
      user.msgs.push(result._id);
      userF.msgs.push(result._id);
      await user.save();
      await userF.save();

      res.status(200).json(result._id);
    });
  }
};
