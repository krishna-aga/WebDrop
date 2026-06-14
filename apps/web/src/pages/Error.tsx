import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="h-24 w-24 text-destructive mb-6" />
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-muted-foreground mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild size="lg">
        <Link to="/">Return Home</Link>
      </Button>
    </div>
  );
}
