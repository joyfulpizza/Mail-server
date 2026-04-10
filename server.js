const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {}; // roomId -> { sharer: socketId }

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("create-room", (roomId) => {
    rooms[roomId] = { sharer: socket.id };
    socket.join(roomId);
    socket.emit("room-created", roomId);
  });

  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) {
      socket.emit("error-msg", "Room not found");
      return;
    }
    socket.join(roomId);
    socket.to(roomId).emit("viewer-joined", socket.id);
  });

  // WebRTC signaling
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
