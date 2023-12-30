const express = require("express");
const moongoose = require("mongoose");
const cors = require("cors");
const User = require("./model/messages");
const chatController = require("./controllers/chat");
const app = express();

const userRouter = require("./routes/user");
const messageRouter = require("./routes/message");
const emailRouter = require("./routes/emailAuthentication");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/", userRouter);
app.use("/chat", messageRouter);
app.use("/email", emailRouter);

moongoose
  .connect(
    "mongodb+srv://khanghvfx17345:IBR9NwJ3lwdaWMhD@cluster0.5jq4ht4.mongodb.net/demo-chat?retryWrites=true&w=majority"
  )
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
        const id = await chatController.saveMessage(
          arg.idChat,
          arg.receiver_id,
          arg.msg,
          arg.type
        );
        socket.to(id).emit("message", { msg: "reloading" });
      });
      socket.on("msgImage", async (file, callback) => {
        const id = await chatController.saveImages({
          ...callback,
          buffer: file,
        });
        socket.to(socket.id).emit("msg-image", { msg: "reloading images" });

        socket.to(id).emit("msg-image", { msg: "reloading images" });
      });
    });
  })
  .catch((err) => {
    console.log(err);
  });
