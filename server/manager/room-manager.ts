import { Socket } from "socket.io";
import { IO } from "../types/types";

interface Room {
  name: string;
  id: string;
}

export class RoomManager {
  private rooms: Room[];
  constructor() {
    this.rooms = [];
  }

  createRoom(value: { name: string }, io: IO) {
    const roomId = crypto.randomUUID();
    this.rooms.push({ name: value.name, id: roomId });

    io.emit("room-created", {
      roomName: value.name,
      id: roomId,
    });
  }

  deleteRoom(value: { id: string }, io: IO) {
    this.rooms.filter((room) => room.id !== value.id);
    io.emit("room-deleted", { message: "Room deleted", id: value.id });
  }

  onOffer(offer: RTCSessionDescription, receiverUser: Socket) {
    receiverUser.emit("offer", { sdpOffer: offer });
  }
}
