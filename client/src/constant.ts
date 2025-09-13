export const signalingChannel: {
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
  senderCandidates: unknown[];
  receiverCandidates: unknown[];
} = {
  offer: null,
  answer: null,
  senderCandidates: [],
  receiverCandidates: [],
};
