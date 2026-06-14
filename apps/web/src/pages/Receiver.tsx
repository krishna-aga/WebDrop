import { useState } from "react";
import { useParams } from "react-router-dom";
import { FileCard } from "@/components/FileCard";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ProgressBar } from "@/components/ProgressBar";
import { TransferStats } from "@/components/TransferStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Receiver() {
  const { roomId: urlRoomId } = useParams();
  const [roomId, setRoomId] = useState(urlRoomId || "");
  const [joined, setJoined] = useState(!!urlRoomId);
  
  // These will be wired up in later phases
  const status: any = joined ? "waiting" : "failed"; 
  const progress = 0;
  const incomingFile = null; // { name: "example.mp4", size: 10485760 }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      setJoined(true);
      // In Phase 3+, we will connect to the room here.
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full">
      <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Receive a File</h2>
          <p className="text-muted-foreground">Enter a room ID or use a share link.</p>
        </div>

        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>Connection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!joined ? (
              <form onSubmit={handleJoin} className="flex gap-4">
                <Input 
                  placeholder="Enter Room ID..." 
                  value={roomId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomId(e.target.value)}
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
                        <ProgressBar progress={progress} label="Downloading..." />
                        <TransferStats speed={0} eta={0} transferred={0} total={10485760} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
