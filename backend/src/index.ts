import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import https from "https";
import { DatabaseService } from "./services/database.service";
import { SchedulerService } from "./services/scheduler.service";
import authRoutes from "./routes/auth.routes";
import messageRoutes from "./routes/message.routes";
import { errorHandler } from "./middleware/error.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL || "https://slack-connect-taupe.vercel.app",
    credentials: true,
  })
);

// 'http://localhost:3000',

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Initialize database
    await DatabaseService.getInstance().initialize();
    console.log("Database initialized successfully");

    // Initialize scheduler
    SchedulerService.getInstance().start();
    console.log("Scheduler service started");

    if (process.env.NODE_ENV === "development") {
      // Use HTTPS in development for Slack OAuth
      const selfsigned = await import("selfsigned");
      const attrs = [{ name: "commonName", value: "localhost" }];
      const pems = selfsigned.default.generate(attrs, { days: 365 });

      const httpsServer = https.createServer(
        {
          key: pems.private,
          cert: pems.cert,
        },
        app
      );

      httpsServer.listen(PORT, () => {
        console.log(`HTTPS Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`Access at: https://localhost:${PORT}`);
        console.log("🔐 You need to accept the self-signed certificate!");
        console.log(
          '📝 Visit https://localhost:3001/api/health and click "Advanced" -> "Proceed to localhost (unsafe)"'
        );
      });
    } else {
      // Use HTTP in production (behind reverse proxy)
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT. Graceful shutdown...");
  SchedulerService.getInstance().stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Graceful shutdown...");
  SchedulerService.getInstance().stop();
  process.exit(0);
});

startServer();
