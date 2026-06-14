import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export function ProgressBar({ progress, label = "Transferring..." }: ProgressBarProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2 w-full" />
    </div>
  );
}
