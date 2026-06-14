import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export function DragDropZone({ onFileSelect, className }: DragDropZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:bg-muted/50",
        className
      )}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="font-semibold text-lg">Drag & Drop your file here</h3>
      <p className="text-sm text-muted-foreground mt-2">or click to browse</p>
      <input
        id="fileInput"
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
