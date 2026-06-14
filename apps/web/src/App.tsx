import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { Home } from "@/pages/Home";
import { Sender } from "@/pages/Sender";
import { Receiver } from "@/pages/Receiver";
import { ErrorPage } from "@/pages/Error";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/send" element={<Sender />} />
            <Route path="/receive/:roomId?" element={<Receiver />} />
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </Router>
  );
}

export default App;
