import { create } from "zustand";
import { io, Socket } from "socket.io-client";

type Status = "waiting" | "connecting" | "connected" | "failed" | "transferring" | "completed";

export interface ChatMessage {
  sender: "me" | "peer";
  text: string;
  timestamp: Date;
}

export interface IncomingFile {
  name: string;
  size: number;
}

interface WebDropState {
  status: Status;
  role: "sender" | "receiver" | null;
  roomId: string | null;
  shareUrl: string | null;
  socket: Socket | null;
  peerConnection: RTCPeerConnection | null;
  file: File | null;
  
  // Data Channel & Transfer State
  dataChannel: RTCDataChannel | null;
  chatMessages: ChatMessage[];
  incomingFile: IncomingFile | null;
  transferredBytes: number;
  speed: number;
  eta: number;
  
  // Actions
  setFile: (file: File | null) => void;
  createRoomAndJoin: () => Promise<void>;
  joinRoom: (roomId: string) => void;
  disconnect: () => void;
  sendChatMessage: (text: string) => void;
  sendFile: () => void;
}

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

// Assuming the server runs on port 8080 locally if dev
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";

export const useWebDropStore = create<WebDropState>((set, get) => ({
  status: "waiting",
  role: null,
  roomId: null,
  shareUrl: null,
  socket: null,
  peerConnection: null,
  file: null,
  dataChannel: null,
  chatMessages: [],
  incomingFile: null,
  transferredBytes: 0,
  speed: 0,
  eta: 0,

  setFile: (file) => set({ file }),

  createRoomAndJoin: async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/create-room`, { method: "POST" });
      const data = await res.json();
      
      const shareUrl = data.shareUrl.startsWith("*")
        ? `${window.location.origin}/receive/${data.roomId}`
        : data.shareUrl;

      set({ roomId: data.roomId, shareUrl, role: "sender" });
      
      // Initialize connection
      get().joinRoom(data.roomId);
    } catch (err) {
      console.error("Failed to create room:", err);
      set({ status: "failed" });
    }
  },

  joinRoom: (roomId: string) => {
    // Prevent multiple connections
    if (get().socket) {
      get().socket?.disconnect();
    }
    
    // Clean up previous references
    get().peerConnection?.close();
    get().dataChannel?.close();

    const clientRole = get().role === "sender" ? "sender" : "receiver";
    
    set({ 
      roomId, 
      status: "waiting", 
      role: clientRole,
      peerConnection: null,
      dataChannel: null,
      chatMessages: [],
      incomingFile: null,
      transferredBytes: 0,
      speed: 0,
      eta: 0
    });

    const socket = io(SERVER_URL);
    set({ socket });

    let receivedChunks: ArrayBuffer[] = [];
    let transferStartTime = 0;

    socket.on("connect", () => {
      socket.emit("join-room", { roomId, role: clientRole }, (res: any) => {
        if (!res.success) {
          set({ status: "failed" });
          console.error(res.error);
        }
      });
    });

    const setupDataChannel = (channel: RTCDataChannel) => {
      channel.binaryType = "arraybuffer";
      channel.bufferedAmountLowThreshold = 65536; // 64 KB
      set({ dataChannel: channel });

      channel.onopen = () => {
        console.log("Data channel opened");
        set({ status: "connected" });
      };

      channel.onclose = () => {
        console.log("Data channel closed");
        set({ dataChannel: null });
      };

      channel.onerror = (err) => {
        console.error("Data channel error:", err);
      };

      channel.onmessage = (event) => {
        if (typeof event.data === "string") {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "chat") {
              set((state) => ({
                chatMessages: [
                  ...state.chatMessages,
                  { sender: "peer", text: data.text, timestamp: new Date() },
                ],
              }));
            } else if (data.type === "file-metadata") {
              receivedChunks = [];
              transferStartTime = Date.now();
              set({
                incomingFile: { name: data.name, size: data.size },
                transferredBytes: 0,
                status: "transferring",
                speed: 0,
                eta: 0,
              });
            } else if (data.type === "transfer-complete") {
              const incoming = get().incomingFile;
              if (incoming && receivedChunks.length > 0) {
                const blob = new Blob(receivedChunks);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = incoming.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
              set({ status: "completed" });
            }
          } catch (err) {
            console.error("Failed to parse string message:", err);
          }
        } else if (event.data instanceof ArrayBuffer) {
          receivedChunks.push(event.data);
          const currentTransferred = get().transferredBytes + event.data.byteLength;
          set({ transferredBytes: currentTransferred });

          const incoming = get().incomingFile;
          if (incoming) {
            const elapsed = (Date.now() - transferStartTime) / 1000;
            const currentSpeed = elapsed > 0 ? currentTransferred / elapsed : 0;
            const remainingBytes = incoming.size - currentTransferred;
            const currentEta = currentSpeed > 0 ? remainingBytes / currentSpeed : 0;
            set({ speed: currentSpeed, eta: currentEta });
          }
        }
      };
    };

    const setupPeerConnection = () => {
      const pc = new RTCPeerConnection(STUN_SERVERS);
      set({ peerConnection: pc });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          set({ status: "connected" });
        } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          set({ status: "failed" });
        }
      };

      return pc;
    };

    // Handle room-joined event
    socket.on("room-joined", async (data) => {
      const currentState = get();
      
      // If we are sender and receiver just joined, we initiate the connection
      if (currentState.role === "sender" && data.role === "receiver") {
        set({ status: "connecting" });
        const pc = setupPeerConnection();
        
        try {
          const channel = pc.createDataChannel("webdrop-data");
          setupDataChannel(channel);

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { roomId, offer });
        } catch (err) {
          console.error("Offer creation failed", err);
        }
      }
      
      // If we are receiver and we just successfully joined
      if (data.role === "receiver" && currentState.role !== "sender") {
        set({ role: "receiver", status: "waiting" }); // Waiting for offer
      }
    });

    socket.on("offer", async (offer) => {
      set({ status: "connecting" });
      const pc = setupPeerConnection();
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer });
      } catch (err) {
        console.error("Failed to handle offer", err);
      }
    });

    socket.on("answer", async (answer) => {
      const pc = get().peerConnection;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error("Failed to handle answer", err);
        }
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      const pc = get().peerConnection;
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Failed to add ICE candidate", err);
        }
      }
    });

    socket.on("peer-disconnected", () => {
      set({ status: "failed" });
      get().peerConnection?.close();
    });

    socket.on("disconnect", () => {
      set({ status: "failed" });
    });
  },

  disconnect: () => {
    const { socket, peerConnection, dataChannel } = get();
    if (dataChannel) dataChannel.close();
    if (peerConnection) peerConnection.close();
    if (socket) socket.disconnect();
    set({
      status: "waiting",
      role: null,
      roomId: null,
      shareUrl: null,
      socket: null,
      peerConnection: null,
      file: null,
      dataChannel: null,
      chatMessages: [],
      incomingFile: null,
      transferredBytes: 0,
      speed: 0,
      eta: 0,
    });
  },

  sendChatMessage: (text: string) => {
    const { dataChannel } = get();
    if (dataChannel && dataChannel.readyState === "open") {
      dataChannel.send(JSON.stringify({ type: "chat", text }));
      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          { sender: "me", text, timestamp: new Date() },
        ],
      }));
    }
  },

  sendFile: () => {
    const { dataChannel, file } = get();
    if (!dataChannel || !file || dataChannel.readyState !== "open") return;

    // Send metadata
    dataChannel.send(
      JSON.stringify({
        type: "file-metadata",
        name: file.name,
        size: file.size,
      })
    );

    set({
      transferredBytes: 0,
      status: "transferring",
      speed: 0,
      eta: 0,
    });

    const CHUNK_SIZE = 64 * 1024; // 64 KB
    let offset = 0;
    const reader = new FileReader();
    const transferStartTime = Date.now();

    const readNextChunk = () => {
      const currentChannel = get().dataChannel;
      if (!currentChannel || currentChannel.readyState !== "open") {
        console.error("Data channel closed during transfer");
        set({ status: "failed" });
        return;
      }

      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const currentChannel = get().dataChannel;
      if (!currentChannel || currentChannel.readyState !== "open") {
        set({ status: "failed" });
        return;
      }

      currentChannel.send(buffer);
      offset += buffer.byteLength;
      set({ transferredBytes: offset });

      // Update speed & ETA
      const elapsed = (Date.now() - transferStartTime) / 1000;
      const currentSpeed = elapsed > 0 ? offset / elapsed : 0;
      const remainingBytes = file.size - offset;
      const currentEta = currentSpeed > 0 ? remainingBytes / currentSpeed : 0;
      set({ speed: currentSpeed, eta: currentEta });

      if (offset < file.size) {
        // Handle backpressure
        if (currentChannel.bufferedAmount > currentChannel.bufferedAmountLowThreshold) {
          currentChannel.onbufferedamountlow = () => {
            currentChannel.onbufferedamountlow = null;
            readNextChunk();
          };
        } else {
          // Relinquish control briefly to keep UI smooth
          setTimeout(readNextChunk, 0);
        }
      } else {
        currentChannel.send(JSON.stringify({ type: "transfer-complete" }));
        set({ status: "completed" });
      }
    };

    // Start reading
    readNextChunk();
  }
}));
