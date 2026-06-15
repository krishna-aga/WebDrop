import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "waiting" | "connecting" | "connected" | "failed" | "transferring" | "completed";

interface ConnectionStatusProps {
  status: Status;
  message?: string;
}

export function ConnectionStatus({ status, message }: ConnectionStatusProps) {
  const config = {
    waiting: { icon: Loader2, color: "text-muted-foreground", defaultMsg: "Waiting for peer...", spin: true },
    connecting: { icon: Loader2, color: "text-blue-500", defaultMsg: "Connecting...", spin: true },
    connected: { icon: CheckCircle2, color: "text-green-500", defaultMsg: "Connected", spin: false },
    failed: { icon: XCircle, color: "text-destructive", defaultMsg: "Connection failed", spin: false },
    transferring: { icon: Loader2, color: "text-blue-500", defaultMsg: "Transferring...", spin: true },
    completed: { icon: CheckCircle2, color: "text-green-500", defaultMsg: "Transfer complete", spin: false },
  };

  const { icon: Icon, color, defaultMsg, spin } = config[status];

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-5 w-5", color, spin && "animate-spin")} />
      <span className={cn("font-medium", color)}>{message || defaultMsg}</span>
    </div>
  );
}
