const User = require("../model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();
exports.getAllUser = async (req, res) => {
  const params = req.params;
  const query = req.query;
  const user = await User.find();
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
  await User.findByIdAndDelete(_id)
    .then((result) => {
      res.status(201).json({ msg: "Delete the user successfully" });
    })
    .catch((err) => {
      res.status(501).json({ msg: "Delete the user failed" });
    });
};
exports.isBanUser = async (req, res) => {
  const user = await User.findById(req.body._id);
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
  const user = await User.findById(req.body._id);
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
    return (
      (element.idUser1._id.toString() === user._id.toString() &&
        element.idUser1.seen === true &&
        element.idUser2.seen === false) ||
      (element.idUser2._id.toString() === user._id.toString() &&
        element.idUser2.seen === true &&
        element.idUser1.seen === false)
    );
  });
  res.json(data);
};
