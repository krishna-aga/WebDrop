import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl">
        <Share2 className="text-primary" />
        <span>WebDrop</span>
      </Link>
      <div className="flex gap-4">
        <Link to="/send" className="hover:text-primary transition-colors">Send</Link>
        <Link to="/receive" className="hover:text-primary transition-colors">Receive</Link>
      </div>
    </nav>
  );
}
