import { File, X } from "lucide-react";
import { formatBytes } from "@repo/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileCardProps {
  file: { name: string; size: number } | null;
  onRemove?: () => void;
}

export function FileCard({ file, onRemove }: FileCardProps) {
  if (!file) return null;

  return (
    <Card className="flex items-center justify-between p-4 bg-muted/30">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <File className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
          <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
      </div>
      {onRemove && (
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </Card>
  );
}
