const User = require("../model/user");
const EmailAuth = require("../model/authentication-email");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const upload = require("../utils/upload");
const { formatName } = require("../utils/removeVietnameseTones");
require("dotenv").config();
//register
exports.createUser = async (req, res, next) => {
  const { userName, password, email, otp } = req.body;

  const emailModel = await EmailAuth.findOne({ email: email });
  const valEmail = await User.findOne({ email: email });
  const valUserName = await User.findOne({ userName: userName });

  if (!emailModel || emailModel.otp !== otp)
    return res.status(480).json({ msg: "otp" });
  if (valEmail) return res.status(400).json({ msg: "email" });
  if (valUserName) return res.status(400).json({ msg: "userName" });

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
      return res.status(401).json({ msg: "user name" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ msg: "password" });
    }
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
  const userMessage = await user.populate("msgs");

  const msgs = userMessage.msgs
    .map((li) => {
      return {
        _id: li._id,
        create: li.createAt,
        user:
          li.idUser1._id.toString() !== req.userId.toString()
            ? li.idUser1._id
            : li.idUser2._id,
        messages: li.messages[li.messages.length - 1],
        seened:
          li.idUser1._id.toString() !== req.userId.toString()
            ? li.idUser1.seen
            : li.idUser2.seen,
      };
    })
    .sort((a, b) => {
      return new Date(b.create) - new Date(a.create);
    })
    .filter((item) => item.messages);

  res.status(200).json(msgs);
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
      return nameUser.includes(name);
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
      res.status(200).json({ msg: "Success" });
    })
    .catch((err) => {
      res.status(500).json({ msg: "Change new name failed" });
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
        msg: "Success",
        listAvatar: user.listAvatar,
        avatar: user.avatar,
      });
    });
  } catch (error) {
    res.status(500).json({ msg: "Failure" });
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
