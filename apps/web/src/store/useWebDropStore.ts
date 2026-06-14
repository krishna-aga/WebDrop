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
  downloadUrl: string | null;
  
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
  downloadUrl: null,

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
    if (get().downloadUrl) {
      URL.revokeObjectURL(get().downloadUrl!);
    }

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
      eta: 0,
      downloadUrl: null
    });

    const socket = io(SERVER_URL);
    set({ socket });

    let receivedChunks: ArrayBuffer[] = [];
    let speedSamples: Array<{ bytes: number; timestamp: number }> = [];

    const updateRollingSpeedAndEta = (transferred: number, total: number) => {
      const now = Date.now();
      speedSamples.push({ bytes: transferred, timestamp: now });

      // Limit sample buffer to the last 20 entries
      if (speedSamples.length > 20) {
        speedSamples.shift();
      }

      if (speedSamples.length < 2) {
        set({ speed: 0, eta: 0 });
        return;
      }

      const oldest = speedSamples[0];
      const newest = speedSamples[speedSamples.length - 1];

      const timeDelta = (newest.timestamp - oldest.timestamp) / 1000; // seconds
      const bytesDelta = newest.bytes - oldest.bytes;

      const currentSpeed = timeDelta > 0 ? bytesDelta / timeDelta : 0;
      const remainingBytes = total - transferred;
      const currentEta = currentSpeed > 0 ? remainingBytes / currentSpeed : 0;

      set({ speed: currentSpeed, eta: currentEta });
    };

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
        console.log("Data channel received message type:", typeof event.data, "binaryType:", channel.binaryType);
        if (typeof event.data === "string") {
          try {
            const data = JSON.parse(event.data);
            console.log("Parsed control message:", data);
            if (data.type === "chat") {
              set((state) => ({
                chatMessages: [
                  ...state.chatMessages,
                  { sender: "peer", text: data.text, timestamp: new Date() },
                ],
              }));
            } else if (data.type === "file-metadata") {
              console.log("File metadata received. Resetting buffers for:", data.name, data.size);
              receivedChunks = [];
              speedSamples = []; // Reset rolling speed calculation
              set({
                incomingFile: { name: data.name, size: data.size },
                transferredBytes: 0,
                status: "transferring",
                speed: 0,
                eta: 0,
              });
            } else if (data.type === "transfer-complete") {
              const incoming = get().incomingFile;
              console.log("Transfer complete received. Chunks count:", receivedChunks.length, "incoming file:", incoming);
              if (incoming && receivedChunks.length > 0) {
                try {
                  const blob = new Blob(receivedChunks);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = incoming.name;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  console.log("Download triggered successfully for:", incoming.name);
                  set({ downloadUrl: url, status: "completed" });
                } catch (blobErr) {
                  console.error("Failed to construct Blob or trigger download:", blobErr);
                  set({ status: "completed" });
                }
              } else {
                console.warn("Could not download file: chunks empty or metadata missing.");
                set({ status: "completed" });
              }
            }
          } catch (err) {
            console.error("Failed to parse string message:", err);
          }
        } else {
          // Robust binary chunk handling (supporting both ArrayBuffer and Blob)
          let bufferPromise: Promise<ArrayBuffer>;
          if (event.data instanceof ArrayBuffer) {
            bufferPromise = Promise.resolve(event.data);
          } else if (event.data instanceof Blob) {
            console.log("Binary chunk is a Blob, extracting ArrayBuffer...");
            bufferPromise = event.data.arrayBuffer();
          } else {
            console.warn("Received unexpected binary data type:", event.data);
            return;
          }

          bufferPromise.then((buffer) => {
            receivedChunks.push(buffer);
            const currentTransferred = get().transferredBytes + buffer.byteLength;
            set({ transferredBytes: currentTransferred });

            const incoming = get().incomingFile;
            if (incoming) {
              updateRollingSpeedAndEta(currentTransferred, incoming.size);
            }
          }).catch((err) => {
            console.error("Failed to extract ArrayBuffer from binary data:", err);
          });
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
    const { socket, peerConnection, dataChannel, downloadUrl } = get();
    if (dataChannel) dataChannel.close();
    if (peerConnection) peerConnection.close();
    if (socket) socket.disconnect();
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
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
      downloadUrl: null,
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

    // Reset speed samples inside this closure by referencing the parent's closed-over samples or resetting a local copy.
    // We re-initialize the rolling speed calculation samples.
    // We want to access the speedSamples defined in joinRoom, but sendFile is outside joinRoom.
    // Wait, is speedSamples defined inside joinRoom? Yes!
    // But sendFile is defined in the store. How does sendFile access speedSamples if it was defined in joinRoom?
    // Oh! In my replacement content, speedSamples was defined inside joinRoom.
    // If sendFile is called, it cannot directly access speedSamples of joinRoom!
    // Let's check: was it accessing transferStartTime earlier?
    // Earlier: `const transferStartTime = Date.now();` was created locally in sendFile!
    // Ah! Yes, `transferStartTime` was local to `sendFile`.
    // If we want `sendFile` to use a rolling window, we can define `speedSamples` inside `sendFile` as a local array!
    // Let's see: `let speedSamples: Array<{ bytes: number; timestamp: number }> = [];` inside `sendFile` is perfect!
    // This is because `sendFile` is called once per file transmission, so a local array in `sendFile` is closed over by `reader.onload` and is exactly what we need!
    // This is super clean!
    // Let's implement it like that.
    const fileSpeedSamples: Array<{ bytes: number; timestamp: number }> = [];

    const updateFileRollingSpeedAndEta = (transferred: number, total: number) => {
      const now = Date.now();
      fileSpeedSamples.push({ bytes: transferred, timestamp: now });

      if (fileSpeedSamples.length > 20) {
        fileSpeedSamples.shift();
      }

      if (fileSpeedSamples.length < 2) {
        set({ speed: 0, eta: 0 });
        return;
      }

      const oldest = fileSpeedSamples[0];
      const newest = fileSpeedSamples[fileSpeedSamples.length - 1];

      const timeDelta = (newest.timestamp - oldest.timestamp) / 1000;
      const bytesDelta = newest.bytes - oldest.bytes;

      const currentSpeed = timeDelta > 0 ? bytesDelta / timeDelta : 0;
      const remainingBytes = total - transferred;
      const currentEta = currentSpeed > 0 ? remainingBytes / currentSpeed : 0;

      set({ speed: currentSpeed, eta: currentEta });
    };

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

      updateFileRollingSpeedAndEta(offset, file.size);

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
