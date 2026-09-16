// src/components/ActiveTripBanner.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Compass,
  BatteryCharging,
  BatteryWarning,
  CheckCircle2,
  X,
  Play,
  ArrowUpRight,
  Sparkles,
  Zap,
  Bike,
  Footprints,
  Car,
  Bus,
  Train,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { apiRequest } from "../api/api";
import {
  getLocalActiveTrip,
  saveLocalActiveTrip,
  clearLocalActiveTrip,
  formatDuration,
  isRecoveredAlertDismissed,
  setRecoveredAlertDismissed,
} from "../utils/geoUtils";

const getModeIcon = (mode) => {
  const m = (mode || "").toLowerCase();
  if (m === "bike" || m === "cycling") return Bike;
  if (m === "walk" || m === "walking") return Footprints;
  if (m === "bus" || m === "transit") return Bus;
  if (m === "train" || m === "rail") return Train;
  return Car;
};

export default function ActiveTripBanner() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTrip, setActiveTrip] = useState(null);
  const [recoveredTrip, setRecoveredTrip] = useState(null);
  const [claimingRecovered, setClaimingRecovered] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  // Check for active or recovered trip on mount and location changes
  const checkTrips = async () => {
    const local = getLocalActiveTrip();

    // 1. If currently on /track, don't show the active floating banner (tracker already has HUD)
    // but we still check for recovered trip if not dismissed
    if (local && local.status === "in_progress") {
      // Check if this was saved before a crash/battery loss (older than 90 seconds without recent heartbeat ping)
      const lastPing = local.lastHeartbeat ? new Date(local.lastHeartbeat).getTime() : 0;
      const isStale = Date.now() - lastPing > 60 * 1000;

      if (isStale && !isRecoveredAlertDismissed() && location.pathname !== "/track") {
        setRecoveredTrip(local);
        setActiveTrip(null);
        return;
      }

      setActiveTrip(local);
      setRecoveredTrip(null);
      return;
    }

    // 2. Check cloud backend for active trip if local is empty
    const token = localStorage.getItem("tripchain_token");
    if (token && !local) {
      try {
        const res = await apiRequest("/api/trips/live/active");
        if (res?.hasActiveTrip && res.session) {
          saveLocalActiveTrip(res.session);
          const lastPing = res.session.lastHeartbeat
            ? new Date(res.session.lastHeartbeat).getTime()
            : 0;
          const isStale = Date.now() - lastPing > 60 * 1000;

          if (isStale && !isRecoveredAlertDismissed() && location.pathname !== "/track") {
            setRecoveredTrip(res.session);
            setActiveTrip(null);
          } else {
            setActiveTrip(res.session);
          }
        } else {
          setActiveTrip(null);
        }
      } catch (_) {}
    } else if (!local) {
      setActiveTrip(null);
    }
  };

  useEffect(() => {
    checkTrips();
    const interval = setInterval(checkTrips, 5000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Handle claiming points for a trip recovered from dead battery / crash
  const handleClaimRecovered = async () => {
    if (!recoveredTrip) return;
    setClaimingRecovered(true);

    try {
      const dist = Number(recoveredTrip.actualDistance || 0.1);
      const durMin = Math.max(
        1,
        Math.round((recoveredTrip.durationSeconds || 60) / 60)
      );

      const res = await apiRequest("/api/trips/live/end", "POST", {
        actualDistance: dist,
        durationMinutes: durMin,
        mode: recoveredTrip.mode,
        routeType: recoveredTrip.routeType,
        from: recoveredTrip.from,
        to: recoveredTrip.to,
        isPartial: true,
        finalStopName: "Preserved Checkpoint (Battery/Crash Recovery)",
      });

      clearLocalActiveTrip();
      setRecoveredTrip(null);
      setRecoveredAlertDismissed(true);

      setSuccessToast(
        `🎉 Successfully recovered ${dist.toFixed(
          1
        )} km trip! +${res?.rewards?.pointsEarned || 15} Eco Points claimed!`
      );
      setTimeout(() => setSuccessToast(""), 6000);
    } catch (err) {
      alert("Failed to claim recovered trip: " + (err.message || "Unknown error"));
    } finally {
      setClaimingRecovered(false);
    }
  };

  const handleResumeRecovered = () => {
    setRecoveredAlertDismissed(true);
    setRecoveredTrip(null);
    navigate("/track");
  };

  const handleDiscardRecovered = async () => {
    try {
      await apiRequest("/api/trips/live/active", "DELETE");
    } catch (_) {}
    clearLocalActiveTrip();
    setRecoveredTrip(null);
    setRecoveredAlertDismissed(true);
  };

  const isTrackerPage = location.pathname === "/track";

  return (
    <>
      {/* 1. SUCCESS TOAST */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            style={{
              position: "fixed",
              top: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 99999,
              background: "#10B981",
              color: "#FFFFFF",
              padding: "14px 24px",
              borderRadius: "16px",
              border: "3px solid #14213D",
              boxShadow: "4px 4px 0px #14213D",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "15px",
            }}
          >
            <Sparkles size={20} /> {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CRASH / BATTERY DEATH RECOVERY MODAL */}
      <AnimatePresence>
        {recoveredTrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(20, 33, 61, 0.55)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              zIndex: 99990,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(28px) saturate(130%)",
                WebkitBackdropFilter: "blur(28px) saturate(130%)",
                borderRadius: "24px",
                border: "3.5px solid #14213D",
                boxShadow: "inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 8px 8px 0px #14213D",
                maxWidth: "520px",
                width: "100%",
                padding: "28px",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#FEF3C7",
                  border: "2px solid #F59E0B",
                  padding: "6px 14px",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "13px",
                  color: "#B45309",
                  marginBottom: "16px",
                }}
              >
                <BatteryWarning size={16} /> INTERRUPTED EXPEDITION RECOVERED
              </div>

              <h2
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "900",
                  color: "#14213D",
                  margin: "0 0 12px",
                  lineHeight: "1.2",
                }}
              >
                Your Travel Progress Was Safely Preserved!
              </h2>

              <p
                style={{
                  color: "#475569",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  marginBottom: "20px",
                }}
              >
                It looks like your device powered off, battery died, or the connection closed during your journey to{" "}
                <strong style={{ color: "#14213D" }}>{recoveredTrip.to}</strong>.
                Our Battery-Guard checkpoint system saved your live coordinates and distance!
              </p>

              {/* Stats Box */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  background: "#F8FAFC",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "2.5px solid #14213D",
                  marginBottom: "24px",
                  textAlign: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Distance</span>
                  <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#14213D" }}>
                    {(recoveredTrip.actualDistance || 0).toFixed(1)} km
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Duration</span>
                  <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#14213D" }}>
                    {formatDuration(recoveredTrip.durationSeconds || 0)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Est. Points</span>
                  <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#059669" }}>
                    +{Math.max(10, Math.round((recoveredTrip.actualDistance || 1) * 8))} XP
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={handleClaimRecovered}
                  disabled={claimingRecovered}
                  style={{
                    background: "#10B981",
                    color: "#FFFFFF",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "3px solid #14213D",
                    boxShadow: "3px 3px 0px #14213D",
                    fontWeight: "800",
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <CheckCircle2 size={18} />
                  {claimingRecovered ? "Saving & Claiming..." : "Save Traveled Distance & Claim Points"}
                </button>

                <button
                  onClick={handleResumeRecovered}
                  style={{
                    background: "#3A86FF",
                    color: "#FFFFFF",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "3px solid #14213D",
                    boxShadow: "3px 3px 0px #14213D",
                    fontWeight: "800",
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Play size={18} /> Resume Active Live Tracker
                </button>

                <button
                  onClick={handleDiscardRecovered}
                  style={{
                    background: "#FFFFFF",
                    color: "#64748b",
                    padding: "10px",
                    borderRadius: "12px",
                    border: "2px solid #cbd5e1",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  Discard this recovered journey
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. GLOBAL ACTIVE TRIP FLOATING BAR (visible across app when trip is live) */}
      <AnimatePresence>
        {activeTrip && !isTrackerPage && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            style={{
              position: "fixed",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9000,
              width: "calc(100% - 32px)",
              maxWidth: "760px",
              background: "rgba(20, 33, 61, 0.85)",
              backdropFilter: "blur(24px) saturate(140%)",
              WebkitBackdropFilter: "blur(24px) saturate(140%)",
              color: "#FFFFFF",
              borderRadius: "999px",
              border: "2.5px solid #00F5D4",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 12px 36px rgba(0,0,0,0.3), 4px 4px 0px #00F5D4",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            {/* Left: Pulsing Live Beacon & Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: "#00F5D4",
                    boxShadow: "0 0 12px #00F5D4",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "2px solid #00F5D4",
                    opacity: 0.6,
                    animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "800" }}>
                  <span style={{ color: "#00F5D4", textTransform: "uppercase", letterSpacing: "0.5px" }}>Live Journey</span>
                  <span style={{ color: "#94A3B8" }}>•</span>
                  <span>To {activeTrip.to || "Destination"}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600", display: "flex", gap: "10px", marginTop: "2px" }}>
                  <span>{(activeTrip.actualDistance || 0).toFixed(2)} km covered</span>
                  <span>{formatDuration(activeTrip.durationSeconds || 0)}</span>
                  {activeTrip.batteryLevel && (
                    <span style={{ color: activeTrip.batteryLevel <= 20 ? "#F87171" : "#A7F3D0" }}>
                      🔋 {activeTrip.batteryLevel}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => navigate("/track")}
                style={{
                  background: "#00F5D4",
                  color: "#14213D",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  border: "2px solid #14213D",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "2px 2px 0px #14213D",
                }}
              >
                <Compass size={16} /> Open Tracker
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
