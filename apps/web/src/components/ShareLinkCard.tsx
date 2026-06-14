import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ShareLinkCardProps {
  url: string;
}

export function ShareLinkCard({ url }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <Card className="p-4 bg-muted/30">
      <p className="text-sm font-medium mb-2">Share this link with the receiver:</p>
      <div className="flex gap-2">
        <Input value={url} readOnly className="bg-background" />
        <Button variant="secondary" onClick={handleCopy} className="shrink-0 w-24">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
