import { useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";

export function Sender() {
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const { sendMessage, lastJsonMessage } = useWebSocket("ws://localhost:8080", {
    retryOnError: true,
    reconnectAttempts: 5,
  });

  useEffect(() => {
    const data = lastJsonMessage as Record<string, unknown>;
    if (!data || !data.event) return;

    const pc = pcRef.current;

    if (data.event === "receiver_answer" && pc && "answer" in data) {
      pc.setRemoteDescription(data.answer as RTCSessionDescriptionInit);
    }

    if (pc && data.event === "receiver_candidates" && "candidate" in data) {
      pc.addIceCandidate(data.candidate as RTCIceCandidateInit);
    }
  }, [lastJsonMessage]);

  async function sendStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage(
            JSON.stringify({
              event: "sender_candidates",
              candidate: event.candidate,
            })
          );
        }
      };

      pc.addTrack(stream.getTracks()[0], stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendMessage(JSON.stringify({ event: "sender_offer", offer }));
    } catch (error) {
      console.error("Error getting media or creating offer:", error);
    }
  }

  return (
    <div>
      <h2>Sender (Mobile)</h2>
      <button onClick={sendStream}>Send message</button>
    </div>
  );
}
