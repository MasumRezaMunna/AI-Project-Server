import "dotenv/config";
import express from "express";
import cors from "cors";
import experiencesRouter from "./routes/experiences";
import aiRouter from "./routes/ai";
import authRouter from "./routes/auth";
import { connectDB } from "./lib/db";

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "wanderlust-trails-api" });
});

app.use("/api/experiences", experiencesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/auth", authRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Centralized error handler
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

connectDB()
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Wanderlust Trails API running on http://localhost:${PORT}`);
    });
  });
