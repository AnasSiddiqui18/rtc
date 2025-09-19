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

io.on("connection", (socket: Socket) => {
  console.log("a user connected ⚡");

  const userManager = new UserManager();
  userManager.addUsers({ name: `user-${crypto.randomUUID()}`, socket });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
