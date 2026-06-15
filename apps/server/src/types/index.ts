import { Socket } from "socket.io";

export interface ServerToClientEvents {
  "room-joined": (payload: { role: "sender" | "receiver" }) => void;
  "peer-disconnected": () => void;
  "error": (message: string) => void;
  "offer": (payload: any) => void;
  "answer": (payload: any) => void;
  "ice-candidate": (payload: any) => void;
}

export interface ClientToServerEvents {
  "join-room": (payload: { roomId: string; role?: "sender" | "receiver" }, callback: (res: { success: boolean; error?: string }) => void) => void;
  "offer": (payload: { roomId: string; offer: any }) => void;
  "answer": (payload: { roomId: string; answer: any }) => void;
  "ice-candidate": (payload: { roomId: string; candidate: any }) => void;
}

export interface InterServerEvents {}
export interface SocketData {
  roomId?: string;
  role?: "sender" | "receiver";
}

export type WebDropSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
