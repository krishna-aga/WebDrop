import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "../config";
import { WebDropSocket } from "../types";
import { handleRoomEvents } from "./handlers/room.handler";
import { SOCKET_EVENTS } from "../constants/events";

export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket: WebDropSocket) => {
    console.log(`Socket connected: ${socket.id}`);

    handleRoomEvents(io, socket);
  });

  return io;
}
