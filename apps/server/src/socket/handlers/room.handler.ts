import { Server } from "socket.io";
import { WebDropSocket } from "../../types";
import { rooms } from "../../utils/roomStore";
import { SOCKET_EVENTS } from "../../constants/events";

export function handleRoomEvents(io: Server, socket: WebDropSocket) {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ roomId }, callback) => {
    try {
      let room = rooms[roomId];

      if (!room) {
        // First person to join is the sender
        room = {
          id: roomId,
          senderSocketId: socket.id,
        };
        rooms[roomId] = room;
        socket.data.role = "sender";
      } else {
        if (room.receiverSocketId) {
          return callback({ success: false, error: "Room is full" });
        }
        // Second person is the receiver
        room.receiverSocketId = socket.id;
        socket.data.role = "receiver";
      }

      socket.data.roomId = roomId;
      socket.join(roomId);

      callback({ success: true });
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, { role: socket.data.role });

      // If receiver just joined, notify sender
      if (socket.data.role === "receiver") {
        io.to(room.senderSocketId).emit(SOCKET_EVENTS.ROOM_JOINED, { role: "receiver" });
      }
    } catch (error) {
      console.error("Join room error:", error);
      callback({ success: false, error: "Failed to join room" });
    }
  });

  socket.on(SOCKET_EVENTS.OFFER, ({ roomId, offer }) => {
    const room = rooms[roomId];
    if (room && room.receiverSocketId) {
      io.to(room.receiverSocketId).emit(SOCKET_EVENTS.OFFER, offer);
    }
  });

  socket.on(SOCKET_EVENTS.ANSWER, ({ roomId, answer }) => {
    const room = rooms[roomId];
    if (room && room.senderSocketId) {
      io.to(room.senderSocketId).emit(SOCKET_EVENTS.ANSWER, answer);
    }
  });

  socket.on(SOCKET_EVENTS.ICE_CANDIDATE, ({ roomId, candidate }) => {
    const room = rooms[roomId];
    if (!room) return;

    // Forward candidate to the other peer
    const targetSocketId = socket.data.role === "sender" ? room.receiverSocketId : room.senderSocketId;
    if (targetSocketId) {
      io.to(targetSocketId).emit(SOCKET_EVENTS.ICE_CANDIDATE, candidate);
    }
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    // Notify the other peer
    const targetSocketId = socket.data.role === "sender" ? room.receiverSocketId : room.senderSocketId;
    if (targetSocketId) {
      io.to(targetSocketId).emit(SOCKET_EVENTS.PEER_DISCONNECTED);
    }

    // Clean up room
    delete rooms[roomId];
  });
}
