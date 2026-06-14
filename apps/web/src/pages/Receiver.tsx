import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { FileCard } from "@/components/FileCard";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ProgressBar } from "@/components/ProgressBar";
import { TransferStats } from "@/components/TransferStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useWebDropStore } from "@/store/useWebDropStore";

export function Receiver() {
  const { roomId: urlRoomId } = useParams();
  const [roomIdInput, setRoomIdInput] = useState(urlRoomId || "");
  const {
    status,
    joinRoom,
    role,
    disconnect,
    incomingFile,
    transferredBytes,
    speed,
    eta,
    chatMessages,
    sendChatMessage,
    dataChannel
  } = useWebDropStore();
  
  const joined = role === "receiver";
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Disconnect only on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Join room when urlRoomId changes
  useEffect(() => {
    if (urlRoomId) {
      joinRoom(urlRoomId);
    }
  }, [urlRoomId, joinRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdInput.trim()) {
      joinRoom(roomIdInput.trim());
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput.trim());
      setChatInput("");
    }
  };

  const progress = incomingFile && transferredBytes ? (transferredBytes / incomingFile.size) * 100 : 0;
  const isConnectedOrTransferring = status === "connected" || status === "transferring" || status === "completed";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full">
      <div className={`w-full ${isConnectedOrTransferring ? "max-w-5xl" : "max-w-2xl"} space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-500`}>
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Receive a File</h2>
          <p className="text-muted-foreground">Enter a room ID or use a share link.</p>
        </div>

        <div className={`grid grid-cols-1 ${isConnectedOrTransferring ? "md:grid-cols-2" : ""} gap-8`}>
          <Card className="border-2 shadow-sm flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!joined ? (
                  <form onSubmit={handleJoin} className="flex gap-4">
                    <Input 
                      placeholder="Enter Room ID..." 
                      value={roomIdInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomIdInput(e.target.value)}
                      className="text-lg py-6"
                    />
                    <Button type="submit" size="lg" className="px-8">Join</Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Status</h4>
                        <ConnectionStatus status={status} />
                      </div>
                      
                      {incomingFile && (
                        <div className="pt-4 border-t space-y-4">
                          <h4 className="font-semibold">Incoming File</h4>
                          <FileCard file={incomingFile} />
                          
                          <div className="space-y-4 pt-4">
                            <ProgressBar progress={progress} label={status === "completed" ? "Download complete" : "Downloading..."} />
                            <TransferStats speed={speed} eta={eta} transferred={transferredBytes} total={incomingFile.size} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>

          {isConnectedOrTransferring && (
            <Card className="border-2 shadow-sm flex flex-col h-[500px]">
              <CardHeader className="border-b">
                <CardTitle>Direct Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4 overflow-hidden justify-between h-[400px]">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No messages yet. Send a message to start chatting!
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          msg.sender === "me" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                            msg.sender === "me"
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-muted text-foreground rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={!dataChannel}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!dataChannel || !chatInput.trim()}>
                    Send
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
