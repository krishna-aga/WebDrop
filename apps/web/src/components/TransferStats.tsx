import { formatBytes } from "@repo/utils";

interface TransferStatsProps {
  speed: number; // bytes per second
  eta: number; // seconds remaining
  transferred: number;
  total: number;
}

export function TransferStats({ speed, eta, transferred, total }: TransferStatsProps) {
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "Calculating...";
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
  };

  return (
    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-xl border">
      <div>
        <p className="text-muted-foreground mb-1">Speed</p>
        <p className="font-semibold">{formatBytes(speed)}/s</p>
      </div>
      <div>
        <p className="text-muted-foreground mb-1">Time Remaining</p>
        <p className="font-semibold">{formatTime(eta)}</p>
      </div>
      <div className="col-span-2">
        <p className="text-muted-foreground mb-1">Transferred</p>
        <p className="font-semibold">
          {formatBytes(transferred)} / {formatBytes(total)}
        </p>
      </div>
    </div>
  );
}
