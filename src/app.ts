// import dotenv from "dotenv";
// dotenv.config();
import "dotenv/config";

import express from "express";
import type { Request, Response, NextFunction } from "express";

import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./utils/db.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import searchRoutes from "./routes/search.routes.js";

import path from "node:path";
import multer from "multer";
import { HttpError } from "./utils/httpError.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// To let other pages (Frontend) to use your resources
// crossOriginResourcePolicy Header allow using our resources from another origin
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use("/uploads", express.static(path.resolve("uploads")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/search", searchRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler Middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(error);

  if (error instanceof multer.MulterError) {
    res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "File too large" : error.message});
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error"});
    return;
  }

  res.status(500).json({ message: "Internal Server Error"});
});

const PORT = process.env.APP_PORT || 3000;

connectDB()
  .then(() =>
    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);
    }),
  )
  .catch((err: Error) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
