import { useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";

export function Receiver() {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const { sendMessage, lastJsonMessage } = useWebSocket("ws://localhost:8080", {
    retryOnError: true,
    reconnectAttempts: 5,
  });

  useEffect(() => {
    const data = lastJsonMessage as Record<string, unknown>;
    if (!data || !data.event) return;

    const pc = pcRef.current;

    if (data.event === "sender_offer" && pc && "offer" in data) {
      (async () => {
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        pc.ontrack = (event) => {
          const audioEl =
            document.querySelector<HTMLAudioElement>("#remoteAudio");
          if (audioEl) audioEl.srcObject = event.streams[0];
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendMessage(
              JSON.stringify({
                event: "receiver_candidates",
                candidate: event.candidate,
              })
            );
          }
        };

        await pc.setRemoteDescription(data.offer as RTCSessionDescriptionInit);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendMessage(
          JSON.stringify({
            event: "receiver_answer",
            answer,
          })
        );
      })();
    }

    if (pc && data.event === "sender_candidates") {
      pc.addIceCandidate(data.candidate as RTCIceCandidateInit);
    }

    // eslint-disable-next-line
  }, [lastJsonMessage]);

  return (
    <div>
      <h2>Receiver (PC)</h2>
      <p>Waiting for audio stream...</p>
      <audio src="/music.mp3" id="remoteAudio" controls autoPlay />
    </div>
  );
}
