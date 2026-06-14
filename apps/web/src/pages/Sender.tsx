import { useState } from "react";
import { DragDropZone } from "@/components/DragDropZone";
import { FileCard } from "@/components/FileCard";
import { ShareLinkCard } from "@/components/ShareLinkCard";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ProgressBar } from "@/components/ProgressBar";
import { TransferStats } from "@/components/TransferStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Sender() {
  const [file, setFile] = useState<File | null>(null);
  
  // These will be wired up in later phases
  const roomId = "mock-room-123";
  const shareUrl = `${window.location.origin}/receive/${roomId}`;
  let status: any = "waiting"; 
  const progress = 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full">
      <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Send a File</h2>
          <p className="text-muted-foreground">Select a file to start sharing directly.</p>
        </div>

        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!file ? (
              <DragDropZone onFileSelect={setFile} />
            ) : (
              <div className="space-y-6">
                <FileCard file={file} onRemove={() => setFile(null)} />
                <ShareLinkCard url={shareUrl} />
                
                <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Status</h4>
                    <ConnectionStatus status={status} />
                  </div>
                  
                  {status === ("connecting" as any) && (
                    <div className="space-y-4">
                      <ProgressBar progress={progress} />
                      <TransferStats speed={0} eta={0} transferred={0} total={file.size} />
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
