import express, { Express, Request, Response, NextFunction } from "express";
import http from "http";
import { Server } from "socket.io";
import { createClient, RedisClientType } from "redis";
import session from "express-session";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import errorHandler from "./utils/errorHandler";
import { loadAllSchedules } from "./services/schedulerService";
import authRoutes from "./routes/authRoutes";
import integrationRoutes from "./routes/integrationRoutes";
import monitorRoutes from "./routes/monitorRoutes";
import statusPageRoutes from "./routes/statusPageRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import incidentRoutes from "./routes/incidentRoutes";
import logger from "./utils/logger";
import { initQueue } from "./services/queueService";
import { RedisClient } from "bullmq";
import passport from "./config/passport";
import cors from "cors";
import paymentRoutes from "./routes/paymentRoutes";
// Initialize environment variables
dotenv.config();
export let redisClient: RedisClientType;

// Initialize Redis client
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    // Add SSL configuration for secure connections
    socket: {
      tls: true,
      rejectUnauthorized: false,
    },
  });
} else {
  redisClient = createClient({
    url: "redis://localhost:6379",
  });
}

// Connect to Redis with error handling
redisClient.on("error", (err) => {
  logger.error("Redis connection error:", err);
});

redisClient.on("connect", () => {
  logger.info("Redis connected");
});

// Declare io at module scope
export let io: Server;

// Connect to MongoDB and Redis before starting the server
async function startServer() {
  try {
    await connectDB(); // MongoDB connection
    await redisClient.connect(); // Redis connection
    logger.info("All services connected, starting server...");

    const app: Express = express();
    app.get("/", (req, res) => {
      res.status(401).json({ message: "lol" });
    });
    const server = http.createServer(app);
    const frontendUrl = process.env.FRONTEND_URL;
    const statusUrl = process.env.FRONTEND_URL_STATUS;

    // 2. Create a list of origins that are actually defined.
    const allowedOrigins = [frontendUrl, statusUrl].filter(Boolean) as string[]; // .filter(Boolean) removes any undefined/null/empty values

    let corsOrigin;

    // 3. If the list is empty (both env vars were missing), set the origin to '*'.
    //    Otherwise, use the list of provided URLs.
    if (allowedOrigins.length === 0) {
      corsOrigin = "*";
      console.warn(
        "WARNING: No origins defined in environment variables. Defaulting to '*' (allow all)."
      );
    } else {
      corsOrigin = allowedOrigins;
      console.log("Allowed CORS origins:", allowedOrigins);
    }

    // const allowedOrigins = [process.env.FRONTEND_URL || "*",process.env.FRONTEND_URL_STATUS || "*"]
    io = new Server(server, {
      cors: { origin: corsOrigin }, // Adjust for production
    });

    // Middleware
    app.use(cors({ origin: corsOrigin }));
    app.use(express.json());
    app.use(
      session({
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
      })
    );
    app.use(passport.initialize());
    app.use(passport.session());

    // HTTP request logging middleware
    app.use((req, res, next) => {
      logger.http(`${req.method} ${req.originalUrl}`);
      next();
    });

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/monitors", monitorRoutes);
    app.use("/api/status-pages", statusPageRoutes);
    app.use("/status", statusPageRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/incidents", incidentRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/integrations", integrationRoutes);
    // Socket.io events
    io.on("connection", (socket) => {
      logger.info("User connected");
      socket.on("subscribe", ({ monitorIds }: { monitorIds: string[] }) => {
        logger.info(`User subscribed to monitors: ${monitorIds.join(", ")}`);
        monitorIds.forEach((id: string) => socket.join(id));
      });
      socket.on("disconnect", () => logger.info("User disconnected"));
    });

    // Error handler
    app.use(errorHandler);

    // Initialize the BullMQ queue before loading schedules
    initQueue();

    // Load monitor schedules
    await loadAllSchedules();
    logger.info("Monitor schedules loaded successfully");

    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down...");
      await redisClient.quit();
      server.close(() => {
        logger.info("Server shut down");
        process.exit(0);
      });
    });

    return app; // Return app for potential export
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start the server and export app
const appPromise = startServer();
export default appPromise;
