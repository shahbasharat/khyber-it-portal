import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma";
import logger from "./lib/logger";
import authRoutes from "./routes/auth.routes";
import issueRoutes from "./routes/issue.routes";
import checklistRoutes from "./routes/checklist.routes";
import statsRoutes from "./routes/stats.routes";
import reportRoutes from "./routes/report.routes";
import notificationRoutes from "./routes/notification.routes";
import activityRoutes from "./routes/activity.routes";
import serverRoomRoutes from "./routes/serverRoom.routes";
import guestWifiRoutes from "./routes/guestWifi.routes";
import { initCronJobs } from "./jobs/cron";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" }
}));

// Global Rate Limiting - Apply BEFORE routes
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000"
      ].filter(Boolean) as string[];
      
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/server-room", serverRoomRoutes);
app.use("/api/guest-wifi", guestWifiRoutes);

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (error) {
    logger.error({ error }, "Health check failed");
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// Example route using shared schema
import { IssueStatus } from "@khyber/schemas";
app.get("/api/issues/status", (req, res) => {
  res.json({ statuses: Object.values(IssueStatus) });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`🚀 API Server running on port ${PORT}`);
  initCronJobs(); // Initialize scheduled tasks
});
