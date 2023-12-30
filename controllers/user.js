const User = require("../model/user");
const EmailAuth = require("../model/authentication-email");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const upload = require("../utils/upload");

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
    avatar: await link[0],
    idSocket: null,
    email: email,
    createAt: new Date(),
    listAvatar: [await link[0]],
  });
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
      "somesupersecrettoken"
      // ,
      // { expiresIn: "2h" }
    );
    res.status(200).json({ token: token, userName: user.userName });
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
  const name = req.params.userName;
  const user = await User.find({ name: name });
  const dataResponce = user
    .map((u) => ({
      avatar: u.avatar,
      userName: u.name,
      idUser: u._id,
    }))
    .filter((u) => u.idUser.toString() !== req.userId.toString());
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
      res.status(201).json({ msg: "Success" });
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

  if (password !== passwordComfirm)
    return res
      .status(412)
      .json({ msg: "Confirmation password is different from password" });

  const user = await User.findOne({ email: email });
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  await user
    .save()
    .then((result) => {
      res.status(201).json({ msg: "success" });
    })
    .catch((err) => {});
};
