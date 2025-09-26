import { Socket, Server } from "socket.io";
import { createServer } from "node:http";
import express from "express";
import { UserManager } from "./manager/user-manager";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const userManager = new UserManager();

io.on("connection", (socket: Socket) => {
  console.log("a user connected ⚡", socket.id);

  userManager.initHandlers(socket, io);

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3001, () => {
  console.log("listening on *:3001");
});
