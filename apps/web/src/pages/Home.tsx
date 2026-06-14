import { Link } from "react-router-dom";
import { ArrowRight, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto space-y-12 animate-in fade-in zoom-in duration-500">
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
          <Share2 className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl text-balance">
          P2P File Sharing made <span className="text-primary">simple</span>
        </h1>
        <p className="text-xl text-muted-foreground text-balance max-w-xl mx-auto">
          Share files directly between browsers. No servers, no file size limits, completely secure and lightning fast.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-lg">
        <Button asChild size="lg" className="h-16 text-lg rounded-2xl group relative overflow-hidden">
          <Link to="/send">
            <div className="absolute inset-0 bg-primary/20 transition-transform group-hover:scale-105" />
            <span className="relative flex items-center gap-2">
              Send Files <ArrowRight className="h-5 w-5" />
            </span>
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="h-16 text-lg rounded-2xl group relative overflow-hidden bg-secondary hover:bg-secondary/80">
          <Link to="/receive">
            <div className="absolute inset-0 bg-secondary-foreground/5 transition-transform group-hover:scale-105" />
            <span className="relative flex items-center gap-2">
              Receive Files <Download className="h-5 w-5" />
            </span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
