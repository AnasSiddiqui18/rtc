import { useEffect, useRef } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/provider/socket-provider";

interface RoomProps {
  room: { name: string | null; id: string | null };
  members: { id: string }[];
  localVideoTrack: MediaStreamTrack | null;
}

export function Room({ room, localVideoTrack, members }: RoomProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const sendingPcRef = useRef<RTCPeerConnection | null>(null);
  const receivingPcRef = useRef<RTCPeerConnection | null>(null);

  const { socket } = useSocket();

  useEffect(() => {
    if (!localVideoTrack || !socket || !localVideoRef.current) return;

    console.log("setting local video track", localVideoTrack);

    const stream = new MediaStream([localVideoTrack!]);

    localVideoRef.current.srcObject = stream;

    socket.on("create-offer", async (roomId: string) => {
      console.log("create offer called", localVideoTrack, socket);

      const pc = new RTCPeerConnection();
      sendingPcRef.current = pc;

      pc.onicecandidate = async (e) => {
        if (!e.candidate) {
          return;
        }
        console.log("on ice candidate on sending side");
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "sender",
            roomId: room.id,
          });
        }
      };

      pc.addTrack(localVideoTrack, stream);
      const sdpOffer = await pc.createOffer();
      pc.setLocalDescription(sdpOffer);
      console.log("offer created", sdpOffer);
      socket.emit("offer", sdpOffer, roomId);
    });

    socket.on("offer", async (sdpOffer: RTCSessionDescriptionInit) => {
      // this will be called when the second user joins
      console.log("offer received", sdpOffer);

      const pc = new RTCPeerConnection();

      pc.ontrack = (event) => {
        const { streams } = event;

        if (!remoteVideoRef.current) return;

        console.log("remote track received from sender", streams);

        if (!remoteVideoRef.current.srcObject) {
          console.log("setting remote video track");
          remoteVideoRef.current.srcObject = streams[0];
        }
      };

      const stream = new MediaStream([localVideoTrack!]);

      pc.setRemoteDescription(sdpOffer);

      console.log("adding remote track (receiver)", localVideoTrack);

      pc.addTrack(localVideoTrack, stream);
      const answer = await pc.createAnswer();
      pc.setLocalDescription(answer);
      receivingPcRef.current = pc;
      socket.emit("answer", room.id, answer);

      pc.onicecandidate = async (e) => {
        if (!e.candidate) {
          return;
        }

        console.log("on ice candidate on receiving side");

        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "receiver",
            roomId: room.id,
          });
        }
      };
    });

    socket.on("answer", (answer: RTCSessionDescriptionInit) => {
      if (!sendingPcRef.current) return;

      console.log("answer received", answer);

      sendingPcRef.current.ontrack = (event) => {
        const { streams } = event;

        if (!remoteVideoRef.current) return;

        console.log("remote track received from reciver", streams);

        if (!remoteVideoRef.current.srcObject) {
          console.log("setting remote video track");
          remoteVideoRef.current.srcObject = streams[0];
        }
      };

      sendingPcRef.current.setRemoteDescription(answer);
    });

    socket.on("add-ice-candidate", (candidate, type) => {
      if (type === "sender") {
        console.log("applying sender candidate to receiver");
        receivingPcRef.current?.addIceCandidate(candidate);
      } else if (type === "receiver") {
        console.log("applying receiver candidate to sender");
        sendingPcRef.current?.addIceCandidate(candidate);
      }
    });

    return () => {
      socket.off("create-offer");
      socket.off("offer");
      socket.off("answer");
      socket.off("add-ice-candidate");
    };
  }, [localVideoTrack, socket, room]);

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-white capitalize font-bold">{room.name}</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* local video */}

        <div className="flex flex-col gap-2">
          <h3 className="text-white capitalize font-bold text-3xl">local</h3>

          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 bg-black rounded-2xl shadow"
          />
        </div>

        {/* remote  video */}

        <div className="flex flex-col gap-2">
          <h3 className="text-white capitalize font-bold text-3xl">remote</h3>

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-64 bg-black rounded-2xl shadow"
          />
        </div>
      </div>

      {/* Members popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Show Members ({members.length})</Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
          <ul className="space-y-1">
            {members.map((member, idx) => (
              <li
                key={idx}
                className="text-sm rounded-md px-2 py-1 hover:bg-muted"
              >
                {`user-${member.id}`}
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
