// src/routes/liveTripRoutes.js
import express from "express";
import {
  startLiveTrip,
  updateCheckpoint,
  getActiveTrip,
  endLiveTrip,
  discardLiveTrip,
} from "../controllers/liveTripController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// All live trip routes require authentication
router.use(authenticate);

router.post("/start", startLiveTrip);
router.post("/checkpoint", updateCheckpoint);
router.get("/active", getActiveTrip);
router.post("/end", endLiveTrip);
router.delete("/active", discardLiveTrip);

export default router;
