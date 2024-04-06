require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../model/user");

exports.getAllUser = async (req, res) => {
  const params = req.params;
  const query = req.query;
  const user = (await User.find()).filter((u) => !u.deleted);
  const responeUser = user.map((e) => ({
    _id: e._id,
    userName: e.userName,
    messages: e.msgs.length,
    totalTime: e.timeOfAccess.totalTime,
    role: e.role,
    baned: e.baned,
    avatar: e.avatar,
  }));
  if (params.topic === "top") {
    const userSort = responeUser.sort((a, b) => b.totalTime - a.totalTime);
    res.status(200).json({
      dataUser: userSort,
      totalUser: user.length,
      totalAccessTime: responeUser.reduce((acc, curr) => {
        return acc + curr.totalTime;
      }, 0),
    });
  } else {
    const itemPage = 6;
    const page = Number(query.page);
    const totalPage = Math.ceil(responeUser.length / itemPage);
    const data = responeUser.slice((page - 1) * itemPage, page.itemPage);
    res.status(200).json({
      totalPage: totalPage,
      dataUser: data,
    });
  }
};
exports.postLogin = async (req, res, next) => {
  const userName = req.body.userName;
  const password = req.body.password;
  try {
    const user = await User.findOne({ userName: userName });
    if (!user) {
      return res.status(401).json({ msg: "User does not exist" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ msg: "incorrect password" });
    }
    if (user.role !== "admin") {
      return res.status(401).json({ msg: "User is not a admin" });
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        userName: user.userName,
        role: user.role,
      },
      process.env.JWT_SIGNATURE
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
exports.deleteUser = async (req, res) => {
  const _id = req.params._id;

  if (_id === req.userId)
    return res.status(403).json({ msg: "Can not delete yourself" });
  // const user = await User.findById(req.body._id);
  const user = await User.findById(_id);

  if (user.userName === "admin")
    return res.status(403).json({ msg: "Can not delete admin" });

  await User.findOneAndUpdate(
    { _id: _id },
    {
      avatar:
        "https://firebasestorage.googleapis.com/v0/b/storage-images-89cf3.appspot.com/o/default-avatar.jpg?alt=media&token=33de296d-d422-4397-b14a-cf1490a8ea8a",
      deleted: true,
      email: "",
    }
  );
  res.status(202).json({ msg: "Delete the user successfully" });
};
exports.isBanUser = async (req, res) => {
  if (req.body._id === req.userId)
    return res.status(403).json({ msg: "Can not ban yourself" });

  const user = await User.findById(req.body._id);
  if (user.userName === "admin")
    return res.status(403).json({ msg: "Can not ban admin" });

  user.baned = !user.baned;
  await user
    .save()
    .then(() => {
      if (user.baned) {
        res.status(200).json({ msg: "The user has been banned" });
      } else {
        res.status(200).json({ msg: "The user has been unban" });
      }
    })
    .catch(() => {
      res.status(501).json({ msg: "Something is wrong!" });
    });
};
exports.IsSetAdmin = async (req, res) => {
  if (req.body._id === req.userId)
    return res.status(403).json({ msg: "Can not set admin yourself" });

  const user = await User.findById(req.body._id);
  if (user.userName === "admin")
    return res.status(403).json({ msg: "Can not set admin for admin" });
  user.role = user.role === "admin" ? "user" : "admin";
  await user
    .save()
    .then(() => {
      if (user.role === "admin") {
        res
          .status(200)
          .json({ msg: "The user have been granted admin rights" });
      } else {
        res
          .status(200)
          .json({ msg: "Has revoked the administrative rights from users" });
      }
    })
    .catch(() => {
      res.status(501).json({ msg: "Something is wrong!" });
    });
};
//Total message has not been read
exports.getTotalMessages = async (req, res) => {
  const user = await User.findOne({ userName: "admin" }).populate("msgs");
  const data = user.msgs.filter((element) => {
    const val = element.users.some(
      (u) => u._id.toString() === user._id.toString && !u.seen
    );
    return val;
  });
  res.json(data);
};
exports.forgotPasswordAuth = async (req, res, next) => {
  const user = await User.findOne({ userName: req.body.userName });
  if (user.role !== "admin")
    return res.status(403).json({ msg: "User name is not admin" });
  next();
};
