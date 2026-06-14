import { createServer } from "http";
import app from "./app";
import { config } from "./config";
import { setupSocket } from "./socket";

const server = createServer(app);

// Initialize Socket.io
setupSocket(server);

server.listen(config.port, () => {
  console.log(`[server]: Server is running at http://localhost:${config.port}`);
});
