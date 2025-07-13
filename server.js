const path = require("path");
const express = require("express");
const http = require("http");
const moment = require("moment");
const socketio = require("socket.io");

const PORT = process.env.PORT || 5008;

const app = express();
const server = http.createServer(app);

// Configure Socket.IO for Vercel
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// In-memory storage for Vercel deployment
let rooms = {};
let socketroom = {};
let socketname = {};
let micSocket = {};
let videoSocket = {};
let roomBoard = {};
let users = [];
let messages = [];

// Add connection logging
io.on("connect", (socket) => {
  console.log("New client connected:", socket.id);
  
  socket.on("join room", (roomid, username) => {
    console.log(`User ${username} joining room: ${roomid}`);
    
    socket.join(roomid);
    socketroom[socket.id] = roomid;
    socketname[socket.id] = username;
    micSocket[socket.id] = "on";
    videoSocket[socket.id] = "on";

    // Store user in memory
    users.push({ id: socket.id, username, roomid });

    if (rooms[roomid] && rooms[roomid].length > 0) {
      rooms[roomid].push(socket.id);
      socket
        .to(roomid)
        .emit(
          "message",
          `${username} joined the room.`,
          "Bot",
          moment().format("h:mm a")
        );
      io.to(socket.id).emit(
        "join room",
        rooms[roomid].filter((pid) => pid != socket.id),
        socketname,
        micSocket,
        videoSocket
      );
    } else {
      rooms[roomid] = [socket.id];
      io.to(socket.id).emit("join room", null, null, null, null);
    }

    io.to(roomid).emit("user count", rooms[roomid].length);
    console.log(`Room ${roomid} now has ${rooms[roomid].length} users`);
  });

  socket.on("action", (msg) => {
    if (msg == "mute") micSocket[socket.id] = "off";
    else if (msg == "unmute") micSocket[socket.id] = "on";
    else if (msg == "videoon") videoSocket[socket.id] = "on";
    else if (msg == "videooff") videoSocket[socket.id] = "off";
  
    socket.to(socketroom[socket.id]).emit("action", msg, socket.id);
  });

  socket.on("message", (msg, username, roomid, userId) => {
    // Emit the message to all clients in the room
    io.to(roomid).emit("message", msg, username, moment().format("h:mm a"));
  
    // Store message in memory (instead of SQLite)
    messages.push({
      username,
      user_id: userId,
      timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
      message: msg
    });
  });

  socket.on("video-offer", (offer, sid) => {
    socket
      .to(sid)
      .emit(
        "video-offer",
        offer,
        socket.id,
        socketname[socket.id],
        micSocket[socket.id],
        videoSocket[socket.id]
      );
  });

  socket.on("video-answer", (answer, sid) => {
    socket.to(sid).emit("video-answer", answer, socket.id);
  });

  socket.on("new icecandidate", (candidate, sid) => {
    socket.to(sid).emit("new icecandidate", candidate, socket.id);
  });

  socket.on("getCanvas", () => {
    if (roomBoard[socketroom[socket.id]])
      socket.emit("getCanvas", roomBoard[socketroom[socket.id]]);
  });

  socket.on("draw", (newx, newy, prevx, prevy, color, size) => {
    socket
      .to(socketroom[socket.id])
      .emit("draw", newx, newy, prevx, prevy, color, size);
  });

  socket.on("clearBoard", () => {
    socket.to(socketroom[socket.id]).emit("clearBoard");
  });

  socket.on("store canvas", (url) => {
    roomBoard[socketroom[socket.id]] = url;
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (!socketroom[socket.id]) return;
    
    socket.to(socketroom[socket.id]).emit(
      "message",
      `${socketname[socket.id]} left the chat.`,
      `Bot`,
      moment().format("h:mm a")
    );
    socket.to(socketroom[socket.id]).emit("remove peer", socket.id);
    var index = rooms[socketroom[socket.id]].indexOf(socket.id);
    rooms[socketroom[socket.id]].splice(index, 1);
    io.to(socketroom[socket.id]).emit(
      "user count",
      rooms[socketroom[socket.id]].length
    );
    
    // Remove user from memory
    users = users.filter(user => user.id !== socket.id);
    
    delete socketroom[socket.id];
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () =>
  console.log(`Server is up and running on port http://localhost:${PORT}`)
);
