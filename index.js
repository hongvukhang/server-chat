require("dotenv").config();
const cors = require("cors");
const express = require("express");
const moongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = express();

const userRouter = require("./routes/user");
const messageRouter = require("./routes/message");
const emailRouter = require("./routes/emailAuthentication");
const adminRouter = require("./routes/admin");

const chatController = require("./controllers/chat");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", userRouter);
app.use("/email", emailRouter);
app.use("/admin", adminRouter);
app.use("/chat", messageRouter);
moongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    const server = app.listen(5000);
    const io = require("./socket").init(server);

    io.on("connection", (socket) => {
      console.log("Client connected " + socket.id);

      chatController.saveIdSocket(socket.handshake.query.id, socket.id);

      socket.on("disconnect", function () {
        chatController.disConnectedUser(socket.handshake.query.id);
      });
      socket.on("msg", async (arg) => {
        let decoded = jwt.verify(arg.token, process.env.JWT_SIGNATURE);

        if (decoded) {
          const id = await chatController.saveMessage(
            arg.idChat,
            decoded.userId,
            arg.msg,
            arg.type
          );
          id.forEach((element) => {
            socket.to(element).emit("message", { msg: "reloading" });
          });
        }
      });
      socket.on("msgImage", async (file, callback) => {
        console.log(callback);
        let decoded = jwt.verify(callback.token, process.env.JWT_SIGNATURE);
        if (decoded) {
          const id = await chatController.saveImages(
            {
              ...callback,
              buffer: file,
            },
            decoded.userId
          );

          socket.to(socket.id).emit("msg-image", { msg: "reloading images" });
          id.forEach((element) => {
            socket.to(element).emit("msg-image", { msg: "reloading" });
          });
        }
      });
    });
  })
  .catch((err) => {
    console.log(err);
  });
