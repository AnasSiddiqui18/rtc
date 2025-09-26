import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
});

export function SocketProvider({ children }: PropsWithChildren) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socket_ins = io("http://localhost:3001");
    socket_ins.connect();

    setSocket(socket_ins);

    socket_ins.on("connected", () => {
      console.log("connected to socket server");
    });

    return () => {
      socket_ins.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context)
    throw new Error("Socket context must be used within a socket provider");

  return { ...context };
};
