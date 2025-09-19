import { Socket } from "socket.io";
import { RoomManager } from "./room-manager";

export interface User {
  name: string;
  socket: Socket;
}

export class UserManager {
  private users: User[];
  private roomManager: RoomManager;

  constructor() {
    this.users = [];
    this.roomManager = new RoomManager();
  }

  addUsers(user: User) {
    const { socket } = user;
    this.users.push(user);
    socket.emit("connected", {
      length: this.users.length,
    });

    this.initHandler(socket);
  }

  initHandler(socket: Socket) {
    socket.on("create-room", (data: { name: string }) => {
      console.log("creating room");
      this.roomManager.createRoom(socket, data);
    });

    socket.on("delete-room", (data: { id: string }) => {
      console.log("deleting room");
      this.roomManager.deleteRoom(socket, { id: data.id });
    });
  }
}
