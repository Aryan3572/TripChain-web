// src/controllers/liveTripController.js
import prisma from "../config/prisma.js";
import { getCache, setCache, deleteCache, clearUserCache } from "../config/redis.js";
import { estimateTripMetrics, calculateTripRewards } from "../utils/metrics.js";
import { checkAndAwardBadges } from "./achievementController.js";

const SESSION_TTL = 86400; // 24 hours retention for recovering dead battery trips

/**
 * Start a new live trip session
 */
export const startLiveTrip = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      from = "My Location",
      to = "Destination",
      mode = "bike",
      routeType = "eco",
      plannedDistance = 0,
      plannedDuration = 0,
      initialCoords = null,
      plannedGeometry = null,
    } = req.body;

    const sessionId = `live_trip_${userId}_${Date.now()}`;
    const startTime = new Date().toISOString();

    const sessionData = {
      sessionId,
      userId,
      from,
      to,
      mode: (mode || "car").toLowerCase(),
      routeType: routeType || "eco",
      plannedDistance: Number(plannedDistance) || 0,
      plannedDuration: Number(plannedDuration) || 0,
      plannedGeometry: plannedGeometry || null,
      actualDistance: 0,
      durationSeconds: 0,
      startTime,
      lastHeartbeat: startTime,
      breadcrumbs: initialCoords ? [initialCoords] : [],
      status: "in_progress",
      batteryLevel: req.body.batteryLevel ?? null,
    };

    // Store in Redis / In-Memory cache with 24h expiration
    await setCache(`live_trip:${userId}`, sessionData, SESSION_TTL);

    return res.status(201).json({
      success: true,
      message: "Live trip tracking session initialized",
      session: sessionData,
    });
  } catch (err) {
    console.error("Error starting live trip:", err);
    return res.status(500).json({ success: false, message: "Failed to initialize live trip" });
  }
};

/**
 * Update live trip heartbeat and telemetry checkpoint
 */
export const updateCheckpoint = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      coords,
      actualDistance = 0,
      durationSeconds = 0,
      speed = 0,
      batteryLevel = null,
      isPaused = false,
    } = req.body;

    const sessionKey = `live_trip:${userId}`;
    const existing = await getCache(sessionKey);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "No active trip session found. It may have expired or been completed.",
      });
    }

    // Keep breadcrumb history (capped to last 250 points for storage efficiency)
    let breadcrumbs = existing.breadcrumbs || [];
    if (coords && coords.lat && coords.lng) {
      const last = breadcrumbs[breadcrumbs.length - 1];
      if (!last || last.lat !== coords.lat || last.lng !== coords.lng) {
        breadcrumbs.push({
          lat: coords.lat,
          lng: coords.lng,
          t: Date.now(),
          speed: speed || 0,
        });
        if (breadcrumbs.length > 250) {
          breadcrumbs = breadcrumbs.slice(-250);
        }
      }
    }

    const updatedSession = {
      ...existing,
      actualDistance: Math.max(existing.actualDistance || 0, Number(actualDistance) || 0),
      durationSeconds: Math.max(existing.durationSeconds || 0, Number(durationSeconds) || 0),
      batteryLevel: batteryLevel !== null ? batteryLevel : existing.batteryLevel,
      lastHeartbeat: new Date().toISOString(),
      isPaused: Boolean(isPaused),
      breadcrumbs,
    };

    await setCache(sessionKey, updatedSession, SESSION_TTL);

    return res.json({
      success: true,
      checkpointAcknowledged: true,
      lastHeartbeat: updatedSession.lastHeartbeat,
    });
  } catch (err) {
    console.error("Error updating checkpoint:", err);
    return res.status(500).json({ success: false, message: "Failed to update checkpoint" });
  }
};

/**
 * Retrieve active live trip session (used for cloud sync & crash/battery restoration)
 */
export const getActiveTrip = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sessionKey = `live_trip:${userId}`;
    const session = await getCache(sessionKey);

    if (!session || session.status !== "in_progress") {
      return res.json({ success: true, hasActiveTrip: false, session: null });
    }

    return res.json({
      success: true,
      hasActiveTrip: true,
      session,
    });
  } catch (err) {
    console.error("Error fetching active trip:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch active trip" });
  }
};

/**
 * End/Complete a live trip (whether completed full distance or stopped in between)
 */
export const endLiveTrip = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      actualDistance,
      durationMinutes,
      finalStopName,
      isPartial = false,
      stoppedEarly = false,
      co2SavedOverride = null,
    } = req.body;

    const sessionKey = `live_trip:${userId}`;
    const cachedSession = (await getCache(sessionKey)) || {};

    const mode = (req.body.mode || cachedSession.mode || "car").toLowerCase();
    const routeType = req.body.routeType || cachedSession.routeType || "eco";
    const from = req.body.from || cachedSession.from || "My Location";

    // Handle stopping in between / partial distance
    let to = req.body.to || cachedSession.to || "Destination";
    if ((isPartial || stoppedEarly) && finalStopName) {
      to = `${finalStopName} (Stopped Early)`;
    }

    const dist = Math.max(0.1, Number(actualDistance || cachedSession.actualDistance || 0.1));
    const dur = Math.max(1, Math.round(Number(durationMinutes || (cachedSession.durationSeconds ? cachedSession.durationSeconds / 60 : 1))));

    // Estimate costs & CO2 metrics based on actual distance traveled
    const { cost, co2 } = estimateTripMetrics(mode, dist);

    // Calculate rewards (pro-rated to distance completed)
    const { points, co2Saved, isEco } = calculateTripRewards(
      routeType,
      mode,
      dist,
      co2SavedOverride !== null ? co2SavedOverride : undefined
    );

    // Save as completed Trip in database
    const trip = await prisma.trip.create({
      data: {
        from,
        to,
        mode,
        distance: Number(dist.toFixed(2)),
        duration: dur,
        cost,
        co2,
        routeType,
        co2Saved,
        points,
        date: new Date(),
        user: { connect: { id: userId } },
      },
    });

    // Check for newly earned badges
    let newlyAwarded = [];
    try {
      const evaluation = await checkAndAwardBadges(userId);
      newlyAwarded = evaluation.newlyAwarded || [];
    } catch (badgeErr) {
      console.warn("Badge evaluation warning:", badgeErr.message);
    }

    // Invalidate user cache and clear live session
    await clearUserCache(userId);
    await deleteCache(sessionKey);

    return res.status(201).json({
      success: true,
      message: (isPartial || stoppedEarly)
        ? `Stopped journey saved! You traveled ${trip.distance} km and earned +${trip.points} points!`
        : `Journey completed! You earned +${trip.points} points and saved ${trip.co2Saved} kg CO₂!`,
      trip,
      isPartial: Boolean(isPartial || stoppedEarly),
      rewards: {
        pointsEarned: trip.points,
        co2Saved: trip.co2Saved,
        isEco,
        newBadges: newlyAwarded,
      },
    });
  } catch (err) {
    console.error("Error ending live trip:", err);
    return res.status(500).json({ success: false, message: "Failed to finalize live trip" });
  }
};

/**
 * Discard an active session (e.g. user canceled or ignores recovered session)
 */
export const discardLiveTrip = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await deleteCache(`live_trip:${userId}`);

    return res.json({
      success: true,
      message: "Active live trip session discarded.",
    });
  } catch (err) {
    console.error("Error discarding live trip:", err);
    return res.status(500).json({ success: false, message: "Failed to discard live trip" });
  }
};
