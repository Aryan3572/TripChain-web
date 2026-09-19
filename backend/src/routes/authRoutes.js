// src/routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  getUserProfile,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authRateLimiter, registerUser);
router.post("/login", authRateLimiter, loginUser);
router.post("/google", authRateLimiter, loginWithGoogle);
router.get("/me", authenticate, getUserProfile);

export default router;
