import { Socket } from "socket.io";

interface Room {
  name: string;
  id: string;
}

export class RoomManager {
  private rooms: Room[];
  constructor() {
    this.rooms = [];
  }

  createRoom(socket: Socket, value: { name: string }) {
    const roomId = crypto.randomUUID();
    this.rooms.push({ name: value.name, id: roomId });

    socket.emit("room-created", {
      roomName: value.name,
      id: roomId,
    });
  }

  deleteRoom(socket: Socket, value: { id: string }) {
    this.rooms.filter((room) => room.id !== value.id);
    socket.emit("room-deleted", { message: "Room deleted", id: value.id });
  }
}
