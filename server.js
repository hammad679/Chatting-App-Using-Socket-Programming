const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require("fs");
const exec = require("child_process").exec;
const util = require("util");
const siofu = require("socketio-file-upload");
const app = express().use(siofu.router);

process.on("warning", (e) => console.warn(e.stack));

app.use(express.static(path.join(__dirname, "public")));

var publicPath = path.join(__dirname, "public");

router.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/"));
});

app.get("/chat", function (req, res) {
  res.sendFile(publicPath + "/chat.html");
});

server = app.listen(3000);

const io = require("socket.io")(server);


var Files = {};

io.on("connection", (socket) => {
  console.log("A User connected")
  socket.on("i_name", (data) => {
    socket.username = data.name;
    socket.broadcast.emit("joined", { username: socket.username });
  });

  var uploader = new siofu();
  uploader.dir = "C:/Users/Muhammad Taaha Iqbal/Desktop/Project CN/Media";
  uploader.listen(socket);

  var uname = socket.username;
  socket.on("uploader_name", (data) => {
    socket.username = data.uname;
    uname = data.uname;
  });

  uploader.on("saved", function (event) {
    console.log(event.file);
    console.log(event.reader);
    var dir = uploader.dir;
    dir += "/";
    dir += event.file.name;

    const data = fs.readFileSync(dir, "base64");

    io.sockets.emit("uploaded", {
      file: data,
      name: event.file.name,
      dir: uploader.dir,
      usrname: uname,
    });
  });

  socket.on("change_username", (data) => {
    socket.username = data.username;
  });

  socket.on("new_message", (data) => {
    io.sockets.emit("new_message", {
      message: data.message,
      username: socket.username,
    });
  });

  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", { username: socket.username });
  });

  socket.on("disconnect", function () {
    socket.broadcast.emit("left", { username: socket.username });
    console.log("User Left");
    socket.disconnect(0);
  });
});
