const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const io = require("../socket");
const User = require("../model/user");
const upload = require("../utils/upload");
const Messages = require("../model/messages");
const EmailAuth = require("../model/authentication-email");
const { formatName } = require("../utils/removeVietnameseTones");

require("dotenv").config();
//register
exports.createUser = async (req, res, next) => {
  const { userName, password, email, otp } = req.body;

  const emailModel = await EmailAuth.findOne({ email: email });
  const valEmail = await User.findOne({ email: email });
  const valUserName = await User.findOne({ userName: userName });

  if (!emailModel || emailModel.otp !== otp)
    return res.status(480).json({ msg: "OTP is incorrect", title: "otp" });
  if (valEmail)
    return res.status(400).json({ msg: "Email has been used", title: "email" });
  if (valUserName)
    return res
      .status(400)
      .json({ msg: "User Name has been used", title: "userName" });

  const link = req.files.map((file) => {
    return upload.upload(file);
  });

  const user = new User({
    userName: userName,
    name: userName,
    password: password,
    connecting: {
      status: false,
      time_out_of: new Date(),
    },
    baned: false,
    role: "user",
    timeOfAccess: {
      timeLogin: null,
      timeLogout: null,
      totalTime: 0,
    },
    avatar: await link[0],
    idSocket: null,
    email: email,
    createAt: new Date(),
    listAvatar: [await link[0]],
    msgs: [],
    friends: [],
    deleted: false,
  });
  console.log(user);
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user
    .save()
    .then(() => {
      res.status(201).send("Success");
    })
    .catch((err) => res.status(500).send(err));
};

//login
exports.postLogin = async (req, res, next) => {
  const userName = req.body.userName;
  const password = req.body.password;
  try {
    const user = await User.findOne({ userName: userName });
    if (!user) {
      return res
        .status(401)
        .json({ msg: "User does not exist", title: "user name" });
    }
    if (user.deleted) {
      return res.status(404).json({ msg: "User does not exist" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res
        .status(401)
        .json({ msg: "Incorrect password", title: "password" });
    }
    if (user.baned)
      return res
        .status(401)
        .json({ msg: "Users have been banned from logging in" });
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        userName: user.userName,
      },
      process.env.JWT_SIGNATURE
      // ,
      // { expiresIn: "2h" }
    );
    user.timeOfAccess.timeLogin = new Date();
    await user.save();
    res.status(200).json({
      token: token,
      userName: user.userName,
      name: user.name,
      avatar: user.avatar,
    });
  } catch (error) {
    console.log(error);
  }
};

//get chat list
exports.getChatList = async (req, res) => {
  const user = await User.findById(req.userId);
  const userMessage = user.msgs;

  const data = [];
  for (let i = 0; i < userMessage.length; i++) {
    const infoMessage = await Messages.findById(userMessage[i]).populate({
      path: "users",
      populate: { path: "_id" },
    });
    if (infoMessage.messages.length === 0) {
      continue;
    }

    const users = infoMessage.users.filter(
      (li) => li._id._id.toString() !== req.userId
    );
    const infoUser = users.map((li) => ({
      avatar: li._id.avatar,
      name: li._id.name,
      connecting: li._id.connecting,
    }));
    const userIndex = infoMessage.users.findIndex(
      (u) => u._id._id.toString() === req.userId.toString()
    );
    const d = {
      ...infoMessage._doc,
      users: infoUser,
      messages:
        infoMessage.messages[infoMessage.messages.length - 1]?.type !== "image"
          ? infoMessage.messages[infoMessage.messages.length - 1].message
          : "new image",
      seend: infoMessage.users[userIndex].seen,
    };
    data.push(d);
  }
  const dataSort = data.sort((a, b) => {
    return new Date(b.createAt) - new Date(a.createAt);
  });
  res.status(200).json(dataSort);
};

// get user
exports.getUser = async (req, res) => {
  const userId = req.params.userId;
  const user = await User.findById(userId);
  res.status(200).json({
    avatar: user.avatar,
    userName: user.name,
    connecting: user.connecting,
  });
};

//search user
exports.searchUser = async (req, res) => {
  const nameReq = req.params.userName;
  const name = formatName(nameReq);

  const user = await User.find();
  const dataResponce = user
    .filter((u) => {
      const nameUser = formatName(u.name);
      return nameUser.includes(name) && !u.deleted;
    })
    .map((u) => ({
      avatar: u.avatar,
      userName: u.name,
      idUser: u._id,
    }));
  res.status(200).json(dataResponce);
};

// change name
exports.changeName = async (req, res) => {
  const idUser = req.userId;
  const newName = req.body.newName;
  const user = await User.findById(idUser);
  user.name = newName;

  await user
    .save()
    .then((result) => {
      res
        .status(200)
        .json({ msg: "The username has been successfully changed" });
    })
    .catch((err) => {
      res.status(500).json({ msg: "The username changes failure" });
    });
};

//get avatar user
exports.getAvatar = async (req, res) => {
  const idUser = req.userId;
  const user = await User.findById(idUser);
  res.status(200).json({ avatar: user.avatar, list: user.listAvatar });
};

//change avatar
exports.changeAvatar = async (req, res) => {
  const user = await User.findById(req.userId);
  try {
    if (req.body.avatar) {
      user.avatar = req.body.avatar;
    }
    if (req.files.length) {
      const link = req.files.map(async (file) => {
        return await upload.upload(file);
      });

      user.avatar = await link[0];

      list = [...user.listAvatar];
      list.push(await link[0]);
      user.listAvatar = list;
    }
    await user.save().then(() => {
      res.status(201).json({
        msg: "Change the avatar was successful",
        listAvatar: user.listAvatar,
        avatar: user.avatar,
      });
    });
  } catch (error) {
    res.status(500).json({ msg: "Changing the avatar has failed" });
  }
};

//new password
exports.newPassword = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const passwordComfirm = req.body.passwordComfirm;
  const otp = req.body.otp;
  const emailAuth = await EmailAuth.findOne({ email: email });

  if (password !== passwordComfirm)
    return res
      .status(412)
      .json({ msg: "Confirmation password is different from password" });

  if (otp !== emailAuth.otp)
    return res.status(408).json({ msg: "OTP is incorrect" });

  const user = await User.findOne({ email: email });
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  await user
    .save()
    .then(async (result) => {
      res.status(201).json({ msg: "Change the password successfully" });
      await EmailAuth.deleteOne({ email: email });
    })
    .catch((err) => {
      res.status(500).json({ msg: "Something is wrong!" });
    });
};
//new password had been authenticated
exports.changePassword = async (req, res) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const user = await User.findById(req.userId);
  if (!bcrypt.compareSync(oldPassword, user.password))
    return res.status(400).json({ msg: "old password" });

  if (newPassword.length < 8)
    return res.status(400).json({ msg: "new password" });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  await user
    .save()
    .then(() => {
      res.status(201).json({ msg: "success" });
    })
    .catch((err) => {
      res.status(400).json({ msg: "Password change failed " });
    });
};
exports.getAdmin = async (req, res) => {
  const admin = await User.findOne({ userName: "admin" });
  const data = {
    avatar: admin.avatar,
    userName: admin.name,
    idUser: admin._id,
  };
  res.status(200).json(data);
};
exports.getAllUser = async (req, res) => {
  const _id = req.userId;
  const users = await User.find();

  const data = users
    .filter((user) => user._id.toString() !== _id)
    .map((user) => ({ name: user.name, avatar: user.avatar, _id: user._id }));

  res.status(200).json(data);
};
exports.getFriends = async (req, res) => {
  const user = await User.findById(req.userId).populate({
    path: "friends",
    populate: { path: "_id" },
  });
  const data = user.friends.map((u) => ({
    _id: u._id._id,
    status: u.status,
    createAt: u.createAt,
    name: u._id.name,
    avatar: u._id.avatar,
  }));

  res.status(200).json(data);
};

exports.addFriends = async (req, res) => {
  const sendId = req.userId;
  const receiverId = req.body._id;

  if (sendId === receiverId)
    return res
      .status(403)
      .json({ msg: "You cannot add yourself to your friends list" });

  const userSend = await User.findById(sendId);
  const val = userSend.friends.some((fr) => fr._id.toString() === receiverId);
  if (val)
    return res.status(403).json({
      msg: "You cannot add users that are already in your friend list",
    });

  const userReceiver = await User.findById(receiverId);

  userSend.friends.push({
    _id: receiverId,
    status: "waiting",
    createAt: new Date(),
    // notify: false,
  });

  userReceiver.friends.push({
    _id: sendId,
    status: "request",
    createAt: new Date(),
    // notify: true,
  });
  await userSend
    .save()
    .then(() => {
      userReceiver.save().then(() => {
        res
          .status(200)
          .json({ msg: `Sent a new friend request to ${userReceiver.name}` });
      });
      io.getIO()
        .to(userReceiver.idSocket)
        .emit("notify", {
          action: "add-friend",
          msg: `You receive a new friend request from ${userSend.name}`,
        });
    })
    .catch((err) => res.status(500).json({ msg: "Some thing wrong!" }));
};

const accessFriend = (user, _id) => {
  const data = user.friends;
  const index = user.friends.findIndex((user) => user._id.toString() === _id);

  data[index] = { createAt: data[index].createAt, status: "friends", _id: _id };

  return data;
};

exports.accessAddFriend = async (req, res) => {
  const idFriend = req.body._id;
  const user = await User.findById(req.userId);
  const userFriend = await User.findById(idFriend);
  const data = accessFriend(user, idFriend);
  const dataFriend = accessFriend(userFriend, req.userId);
  user.friends = data;
  userFriend.friends = dataFriend;

  user
    .save()
    .then(() => {
      userFriend.save().then(() => {
        res.status(200).json({ msg: "You have accepted the friend request" });
        io.getIO()
          .to(userFriend.idSocket)
          .emit("notify", {
            action: "add-friend",
            msg: ` ${userFriend.name} accepted the new friend request`,
          });
      });
    })
    .catch(() => res.status(501).json({ msg: "Some thing wrong!" }));
};

exports.refuseAddFriend = async (req, res) => {
  const idFriend = req.body._id;
  const user = await User.findById(req.userId);
  const userFriend = await User.findById(idFriend);
  const data = user.friends.filter((fr) => fr._id.toString() !== idFriend);
  const dataFriend = userFriend.friends.filter(
    (fr) => fr._id.toString() !== req.userId
  );
  user.friends = data;
  userFriend.friends = dataFriend;
  user
    .save()
    .then(() => {
      userFriend.save().then(() => {
        res.status(200).json({ msg: "You have declined the friend request" });
      });
    })
    .catch(() => res.status(501).json({ msg: "Some thing wrong!" }));
};
exports.deleteFriend = async (req, res) => {
  const idFriend = req.body._id;
  const user = await User.findById(req.userId);
  const userFriend = await User.findById(idFriend);
  const data = user.friends.filter((fr) => fr._id.toString() !== idFriend);
  const dataFriend = userFriend.friends.filter(
    (fr) => fr._id.toString() !== req.userId
  );
  user.friends = data;
  userFriend.friends = dataFriend;
  user
    .save()
    .then(() => {
      userFriend.save().then(() => {
        res.status(200).json({
          msg: `${userFriend.name} has been removed from your friend list`,
        });
      });
    })
    .catch(() => res.status(501).json({ msg: "Some thing wrong!" }));
};
