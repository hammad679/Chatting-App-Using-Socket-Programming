
$(function () {

  var message = $("#message");
  var username = $("#username");
  var send_message = $("#send_message");
  var send_username = $("#send_username");
  var leave_button = $("#leave_button");
  var chatroom = $("#chatroom");
  var feedback = $("#feedback");
  var usrname = "Anonymous";
  var formData = location.search;
  var data = formData.split("=");
  var i_username = data[1];

  console.log(i_username);

  var socket = io.connect("http://localhost:3000");

  socket.on("connect", function () {
    socket.emit("i_name", { name: i_username });
  });

  socket.on("joined", (data) => {
    usrname = data.username;
    feedback.html("");
    chatroom.append(
      "<p class='message'>" +
      data.username +
      " has joined the chat... " +
      "</p>"
    );
    var objDiv = document.getElementById("chatroom");
    objDiv.scrollTop = objDiv.scrollHeight;
  });

  socket.on("left", (data) => {
    usrname = data.username;
    feedback.html("");
    chatroom.append(
      "<p class='message'>" + data.username + " has left the chat... " + "</p>"
    );
    console.log("was in left function");
    var objDiv = document.getElementById("chatroom");
    objDiv.scrollTop = objDiv.scrollHeight;
  });


  var uploader = new SocketIOFileUpload(socket);
  //uploader.listenOnInput(document.getElementById("siofu_input"));

  // document
  //   .getElementById("siofu_input")
  //   .addEventListener("click", uploader.prompt, false);

  uploader.listenOnInput(document.getElementById("upload"));
  uploader.chunkSize = 1024 * 100;
  //uploader.maxFileSize = ;
  uploader.listenOnSubmit(
    document.getElementById("send_message"),
    document.getElementById("upload")
  );

  uploader.addEventListener("progress", function (event) {
    socket.emit("uploader_name", { uname: i_username });
    var percent = (event.bytesLoaded / event.file.size) * 100;
    console.log("File is", percent.toFixed(2), "percent loaded");
  });

  var tempfile;

  uploader.addEventListener("complete", function (event) {
    console.log(event.success);
    console.log(event.file);
    var objDiv = document.getElementById("chatroom");
    objDiv.scrollTop = objDiv.scrollHeight;
  });

  socket.on("uploaded", (data) => {
    alert("File successfully uploaded by " + data.usrname);

    const byteCharacters = window.atob(data.file);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/octet-stream" });

    const objectURL = URL.createObjectURL(blob);
    feedback.html("");
    message.val("");
    chatroom.append(
      "<p class='message'>" +
      data.usrname +
      ": " +
      "<a id= 'FileObject' href='" +
      objectURL +
      "' download='" +
      data.name +
      "'>" +
      data.name +
      "</a>" +
      "</p>"
    );

    console.log(data.file);
    var objDiv = document.getElementById("chatroom");
    objDiv.scrollTop = objDiv.scrollHeight;
  });

  var inputarea = document.getElementById("message");
  if (inputarea) {
    inputarea.addEventListener("keyup", function (e) {
      if (e.key == "Enter") {
        socket.emit("new_message", { message: message.val() });
      }
    });
  }

  send_message.click(function () {
    socket.emit("new_message", { message: message.val() });
  });

  socket.on("new_message", (data) => {
    usrname = data.username;
    feedback.html("");
    message.val("");
    chatroom.append(
      "<p class='message'>" + data.username + ": " + data.message + "</p>"
    );
    var objDiv = document.getElementById("chatroom");
    objDiv.scrollTop = objDiv.scrollHeight;
  });

  var change_name = document.getElementById("username");
  var temp = username.val();
  if (change_name) {
    change_name.addEventListener("keyup", function (e) {
      if (e.key == "Enter") {
        socket.emit("change_username", { username: username.val() });
        alert("Your Username has been changed to " + username.val());
      }
    });
  }

  send_username.click(function () {
    socket.emit("change_username", { username: username.val() });
    alert("Your Username has been changed to " + username.val());
  });

  leave_button.click(function () {
    socket.emit("end", { username: username.val() });
    window.close();
  });

  var typing = false;
  message.bind("keypress", () => {
    typing = true;
    socket.emit("typing");
  });


  function startTimeout(element) {
    setTimeout(function () {
      element.remove();
    }, 10000);
  }

  socket.on("typing", (data) => {
    feedback.html(
      "<p class='message' id = 'typing'>" +
      data.username +
      " is typing a message..." +
      "</p>"
    );

    startTimeout(document.getElementById("typing"));

  });

  socket.on("disconnect", function () {
    console.log("Socket closed from client.");
  });
});
