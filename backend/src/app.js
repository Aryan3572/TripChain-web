import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import tripInsightRoutes from "./routes/tripInsightRoutes.js";
import ecoScoreRoutes from "./routes/ecoScoreRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import patternRoutes from "./routes/patternRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import liveTripRoutes from "./routes/liveTripRoutes.js";

const app = express();

// Security: Disable X-Powered-By fingerprinting
app.disable("x-powered-by");

// Security: Enforce secure HTTP response headers via Helmet
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost",
    "https://tripchain-dusky.vercel.app",
  ],
  credentials: true
}));

// Security: Strictly bound request JSON payload size to prevent memory exhaustion
app.use(express.json({ limit: "50kb" }));

// Security: Apply general rate limiter across all /api endpoints
app.use("/api", apiRateLimiter);

app.get("/", (req, res) => res.json({ message: "🚀 Tripchain API is live!" }));
app.get("/health", (req, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));

app.use("/api/auth", authRoutes);
app.use("/api/trips/live", liveTripRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/trip-insights", tripInsightRoutes);
app.use("/api/eco-score", ecoScoreRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/trips/patterns", patternRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/predictions", predictionRoutes);

// Global error handler LAST
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || err.statusCode || 500;
  const message =
    status === 413
      ? "Payload too large. Request body must not exceed 50kb."
      : status < 500
      ? err.message
      : "Internal Server Error";
  res.status(status).json({ success: false, message });
});

export default app;
