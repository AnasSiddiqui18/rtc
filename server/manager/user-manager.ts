import { Socket } from "socket.io";
import { RoomManager } from "./room-manager";
import { IO } from "../types/types";

export interface User {
  socket: Socket;
  io: IO;
}

interface Rooms {
  [key: string]: Socket[];
}

export class UserManager {
  private rooms: Rooms = {};
  private roomManager: RoomManager;

  constructor() {
    this.rooms = {};
    this.roomManager = new RoomManager();
  }

  initHandlers(socket: Socket, io: IO) {
    socket.on("create-room", (data: { name: string }) => {
      console.log("creating room");
      this.roomManager.createRoom(data, io);
    });

    socket.on("delete-room", (data: { id: string }) => {
      console.log("deleting room");
      this.roomManager.deleteRoom(data, io);
    });

    socket.on("join-room", (roomId: string) => {
      const peers = this.rooms[roomId] || [];
      peers.push(socket);
      this.rooms[roomId] = peers;

      socket.emit("joined-room", {
        userId: socket.id,
        roomId,
      });

      io.emit("peers-count", { id: peers.at(-1)?.id });

      if (peers.length === 2) {
        const firstPeer = this.rooms[roomId][0];
        firstPeer.emit("create-offer", roomId);
      }
    });

    socket.on(
      "offer",
      (sdpOffer: RTCSessionDescriptionInit, roomId: string) => {
        console.log("offer received on server");

        const secondPeer = this.rooms[roomId][1];
        if (!secondPeer) console.error("Second peer not found");

        secondPeer.emit("offer", sdpOffer);
      },
    );

    socket.on("answer", (roomId: string, answer: RTCSessionDescriptionInit) => {
      console.log("answer payload", roomId, answer);

      const firstPeer = this.rooms[roomId][0];
      firstPeer.emit("answer", answer);
    });

    socket.on(
      "add-ice-candidate",
      ({
        candidate,
        type,
        roomId,
      }: {
        candidate: RTCIceCandidate;
        type: "receiver" | "sender";
        roomId: string;
      }) => {
        const peers = this.rooms[roomId];

        const senderPeer = peers[0];
        const receiverPeer = peers[1];

        if (type === "receiver") {
          console.log("sending candidate to sender");

          senderPeer.emit("add-ice-candidate", candidate, "receiver");
          return;
        } else if (type === "sender") {
          console.log("sending candidate to reciver");

          receiverPeer.emit("add-ice-candidate", candidate, "sender");
        }
      },
    );
  }
}
