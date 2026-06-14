import { useEffect, useState, useRef } from "react";
import { DragDropZone } from "@/components/DragDropZone";
import { FileCard } from "@/components/FileCard";
import { ShareLinkCard } from "@/components/ShareLinkCard";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ProgressBar } from "@/components/ProgressBar";
import { TransferStats } from "@/components/TransferStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useWebDropStore } from "@/store/useWebDropStore";

export function Sender() {
  const {
    file,
    setFile,
    status,
    shareUrl,
    createRoomAndJoin,
    disconnect,
    transferredBytes,
    speed,
    eta,
    chatMessages,
    sendChatMessage,
    sendFile,
    dataChannel
  } = useWebDropStore();

  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    await createRoomAndJoin();
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput.trim());
      setChatInput("");
    }
  };

  const progress = file && transferredBytes ? (transferredBytes / file.size) * 100 : 0;
  const isConnectedOrTransferring = status === "connected" || status === "transferring" || status === "completed";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full">
      <div className={`w-full ${isConnectedOrTransferring ? "max-w-5xl" : "max-w-2xl"} space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-500`}>
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Send a File</h2>
          <p className="text-muted-foreground">Select a file to start sharing directly.</p>
        </div>

        <div className={`grid grid-cols-1 ${isConnectedOrTransferring ? "md:grid-cols-2" : ""} gap-8`}>
          <Card className="border-2 shadow-sm flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!file ? (
                  <DragDropZone onFileSelect={handleFileSelect} />
                ) : (
                  <div className="space-y-6">
                    <FileCard file={file} onRemove={() => { setFile(null); disconnect(); }} />
                    {shareUrl && <ShareLinkCard url={shareUrl} />}
                    
                    <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Status</h4>
                        <ConnectionStatus status={status} />
                      </div>
                      
                      {(status === "connecting" || status === "transferring" || status === "connected" || status === "completed") && (
                        <div className="space-y-4">
                          <ProgressBar progress={progress} />
                          <TransferStats speed={speed} eta={eta} transferred={transferredBytes} total={file.size} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
            
            {file && status === "connected" && (
              <div className="p-6 pt-0">
                <Button onClick={sendFile} className="w-full py-6 text-lg font-semibold">
                  Send File
                </Button>
              </div>
            )}
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
