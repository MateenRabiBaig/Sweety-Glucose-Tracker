import express from "express";
import cors from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import readingRoutes from "./routes/readingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

const authLimiter = rateLimit({
    windowMs: 15*60*1000,
    limit: 20,
    message: { message: "Too many attempts. Please try again later." }
});

app.get("/api/health", (req,res) => {
    res.status(200).json({ message: "API is running." });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/reports", reportRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

export default app;