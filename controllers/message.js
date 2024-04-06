const User = require("../model/user");
const Messages = require("../model/messages");

//get chat
exports.getChat1 = async (req, res) => {
  const msgId = req.params.msgId;
  const message = await Messages.findById(msgId);
  const idUsers = [
    message.idUser1._id.toString(),
    message.idUser2._id.toString(),
  ];
  if (!idUsers.includes(req.userId.toString()))
    return res.status(403).json({ msg: "You are not authorized to access" });
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
exports.getChat = async (req, res) => {
  const msgId = req.params.msgId;

  const message = await Messages.findById(msgId).populate({
    path: "users",
    populate: { path: "_id" },
  });

  const idUsers = message.users;

  const isVal = idUsers.some(
    (u) => u._id._id.toString() === req.userId.toString()
  );
  if (!isVal)
    return res.status(403).json({ msg: "You are not authorized to access" });

  const receive = idUsers
    .filter((u) => u._id._id.toString() !== req.userId.toString())
    .map((user) => ({
      avatar: user._id.avatar,
      userName: user._id.name ? user._id.name : user._id.userName,
    }));

  const msg = message.messages.map((mes) => {
    const info = idUsers.filter(
      (user) => user._id._id.toString() === mes.sender.toString()
    );

    return {
      ...mes._doc,
      sender: mes._doc.sender.toString() === req.userId ? true : false,
      avatar: info[0]._id.avatar,
      name: info[0]._id.name,
    };
  });
  const data = {
    messages: msg,
    receive: receive,
  };
  for (let i = 0; i < idUsers.length; i++) {
    if (idUsers[i]._id._id.toString() === req.userId.toString()) {
      message.users[i].seen = true;
      break;
    }
  }
  await message.save();
  res.status(200).json(data);
};

exports.getSendMessage = async (req, res) => {
  const messageCreatorId = req.userId;
  const messageCreator = await User.findById(messageCreatorId);
  const receiverId = req.body.userId;
  if (receiverId.length === 1) {
    const receiver = await User.findById(receiverId[0]);
    const exist = messageCreator.msgs.filter((msg) =>
      receiver.msgs.includes(msg)
    );

    if (exist.length > 0) {
      // xem lại chat group
      res.status(200).json(exist[0]);
    } else {
      const msg = new Messages({
        users: [
          { _id: messageCreatorId, seen: false },
          { _id: receiverId, seen: false },
        ],
        createAt: new Date(),
        messages: [],
      });
      await msg.save().then(async (result) => {
        messageCreator.msgs.push(result._id);
        receiver.msgs.push(result._id);
        await messageCreator.save();

        await receiver.save();
        return res.status(200).json(result._id);
      });
    }
  } else {
    const userMessage = [{ _id: messageCreatorId, seen: true }];
    receiverId.forEach((id) => {
      userMessage.push({ _id: id, seen: true });
    });

    const msg = new Messages({
      users: userMessage,
      createAt: new Date(),
      messages: [],
    });

    await msg.save().then(async (result) => {
      messageCreator.msgs.push(result._id);
      for (let i = 0; i < receiverId.length; i++) {
        const user = await User.findById(receiverId[i]);
        user.msgs.push(result._id);
        await user.save();
      }

      await messageCreator.save();

      res.status(200).json(result._id);
    });
  }
};
