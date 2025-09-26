import { useEffect, useRef, useState } from "react";
import { CreateRoomDialog } from "./components/app/create-room-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Socket } from "socket.io-client";
import { Trash2 } from "lucide-react";
import { Button } from "./components/ui/button";
import { Room } from "./components/app/room";
import { useSocket } from "./provider/socket-provider";

interface Rooms {
  name: string;
  id: string;
}

function App() {
  const [isInsideRoom, setIsInsideRoom] = useState(false);
  const [currentRoom, setcurrentRoom] = useState<{
    name: string | null;
    id: string | null;
  }>({
    id: null,
    name: null,
  });
  const [rooms, setRooms] = useState<Rooms[]>([]);
  const { socket } = useSocket();
  const isScreenSelected = useRef(false);
  const [localVideoTrack, setlocalVideoTrack] =
    useState<MediaStreamTrack | null>(null);

  const [members, setMembers] = useState<{ id: string }[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on("room-created", ({ roomName, id }) => {
      setRooms((prev) => [...prev, { name: roomName, id: id }]);
    });

    socket.on("peers-count", (peerObj) => {
      setMembers((prev) => [...prev, peerObj]);
    });

    socket.on("room-deleted", ({ id }) => {
      setRooms((prev) => prev.filter((room) => room.id !== id));
    });

    socket.on("joined-room", ({ roomId }) => {
      console.log("block runs");

      if (!rooms.length) return;
      const currentRoom = rooms.find((room) => room.id === roomId)!;
      setcurrentRoom({ name: currentRoom.name, id: roomId });
      setIsInsideRoom(true);
    });

    return () => {
      socket.off("joined-room");
      socket.off("peers-count");
      socket.off("room-deleted");
      socket.off("room-created");
    };
  }, [rooms, socket]);

  useEffect(() => {
    async function getLocalMedia() {
      isScreenSelected.current = true;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      console.log("updating local video track");
      setlocalVideoTrack(videoTrack);
    }

    if (!isScreenSelected.current) getLocalMedia();
  }, []);

  return (
    <div className="flex justify-end min-h-screen bg-slate-800 p-5">
      {!isInsideRoom ? (
        <div className=" flex justify-between w-full">
          <RoomCardList socket={socket} rooms={rooms} />

          <div className="flex flex-col gap-5">
            <CreateRoomDialog socket={socket} />
          </div>
        </div>
      ) : (
        <Room
          members={members}
          room={currentRoom}
          localVideoTrack={localVideoTrack}
        />
      )}
    </div>
  );
}

export default App;

export function RoomCardList({
  rooms,
  socket,
}: {
  rooms: Rooms[];
  socket: Socket | null;
}) {
  function deletRoom(id: string) {
    if (!socket) return;

    socket.emit("delete-room", { id });
  }

  function enterRoom(roomId: string) {
    socket?.emit("join-room", roomId);
  }
  //
  return (
    <div className="w-full flex gap-5">
      {rooms.map((room, idx) => (
        <Card
          key={idx}
          className="h-44 w-64 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-3">
            <CardTitle className="text-lg font-semibold">{room.name}</CardTitle>
            <Trash2
              size={18}
              className="cursor-pointer text-red-500 hover:text-red-600"
              onClick={() => deletRoom(room.id)}
            />
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-gray-500">2 users</p>

            <div className="flex justify-end mt-5">
              <Button onClick={() => enterRoom(room.id)}>Enter room</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
