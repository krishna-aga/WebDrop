import express from "express";
import cors from "cors";
import { config } from "./config";
import roomRoutes from "./routes/room.routes";
import { errorHandler } from "./middleware/error.middleware";
import { Application } from "express";

const app: Application = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Routes
app.use("/api", roomRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling
app.use(errorHandler);

export default app;
