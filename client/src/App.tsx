import { useEffect, useState } from "react";
import { CreateRoomDialog } from "./components/app/create-room-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { io, Socket } from "socket.io-client";
import { Trash2 } from "lucide-react";
import { Button } from "./components/ui/button";

interface Rooms {
  name: string;
  id: string;
}

function App() {
  const [rooms, setRooms] = useState<Rooms[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:3000");
    setSocket(socket);
    socket.connect();

    socket.on("connected", (data) => {
      console.log("connected user length", data);
    });

    socket.on("room-created", ({ roomName, id }) => {
      setRooms((prev) => [...prev, { name: roomName, id: id }]);
    });

    socket.on("room-deleted", ({ id }) => {
      setRooms((prev) => prev.filter((room) => room.id !== id));
    });

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="flex justify-end min-h-screen bg-slate-800 p-5">
      <RoomCardList socket={socket} rooms={rooms} />
      <CreateRoomDialog socket={socket} />
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

  return (
    <div className="w-full flex gap-5">
      {rooms.map((room, idx) => (
        <Card
          key={idx}
          className="h-44 w-64 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-3">
            <CardTitle className="text-lg font-semibold">{room.name}</CardTitle>
            <Trash2cle
              size={18}
              className="cursor-pointer text-red-500 hover:text-red-600"
              onClick={() => deletRoom(room.id)}
            />
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-gray-500">2 users</p>

            <div className="flex justify-end mt-5">
              <Button>Enter room</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
