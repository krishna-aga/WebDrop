export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  JOIN_ROOM: "join-room",
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice-candidate",
  ROOM_JOINED: "room-joined",
  PEER_DISCONNECTED: "peer-disconnected",
  ERROR: "error",
} as const;
