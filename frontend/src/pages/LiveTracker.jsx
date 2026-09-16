// src/pages/LiveTracker.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Compass,
  Play,
  Pause,
  StopCircle,
  Flag,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Sparkles,
  Zap,
  Leaf,
  Clock,
  Gauge,
  MapPin,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Bike,
  Footprints,
  Car,
  Bus,
  Train,
  Crosshair,
  X,
  LogOut,
  Trash2,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import { apiRequest } from "../api/api";
import RouteRewardModal from "../components/RouteRewardModal";
import {
  haversineDistance,
  calculatePathDistance,
  isSignificantMovement,
  formatDuration,
  formatSpeedKmh,
  initBatteryMonitor,
  saveLocalActiveTrip,
  getLocalActiveTrip,
  clearLocalActiveTrip,
} from "../utils/geoUtils";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const MODE_ICONS = {
  driving: Car,
  car: Car,
  cycling: Bike,
  bike: Bike,
  walking: Footprints,
  walk: Footprints,
  transit: Bus,
  train: Train,
  carpool: Car,
};

const MODE_CO2_RATES = {
  car: 0.192,
  driving: 0.192,
  bike: 0,
  cycling: 0,
  walk: 0,
  walking: 0,
  transit: 0.065,
  train: 0.041,
  carpool: 0.096,
};

export default function LiveTracker() {
  const location = useLocation();
  const navigate = useNavigate();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const simIntervalRef = useRef(null);

  // Initial params passed from RoutePlanner or state
  const initialTripState = location.state || {};

  // Core Session State
  const [session, setSession] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState(initialTripState.mode || "bike");
  const [destination, setDestination] = useState(initialTripState.to || "");
  const [routeType, setRouteType] = useState(initialTripState.routeType || "eco");
  const [plannedDistance, setPlannedDistance] = useState(
    Number(initialTripState.plannedDistance || initialTripState.distance || 0)
  );

  // Live Metrics State
  const [currentCoords, setCurrentCoords] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [actualDistance, setActualDistance] = useState(0); // km
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [gpsAccuracy, setGpsAccuracy] = useState("Acquiring..."); // "High", "Good", "Low"
  const [batteryInfo, setBatteryInfo] = useState({
    level: 100,
    charging: true,
    isLowBattery: false,
  });

  // UI / Action Modals
  const [confirmEarlyFinish, setConfirmEarlyFinish] = useState(false);
  const [stoppingLocationName, setStoppingLocationName] = useState("");
  const [loadingFinish, setLoadingFinish] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [checkpointStatus, setCheckpointStatus] = useState("Guarded");
  const [showQuickStartModal, setShowQuickStartModal] = useState(false);
  const [showBatteryCutoffModal, setShowBatteryCutoffModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Responsive resize handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Geocoding client
  const geocodingClient = useRef(
    mbxGeocoding({ accessToken: mapboxgl.accessToken })
  ).current;

  // 1. Initialize Battery Monitor
  useEffect(() => {
    let cleanup = () => {};
    initBatteryMonitor((bInfo) => {
      setBatteryInfo(bInfo);
    }).then((unsub) => {
      cleanup = unsub;
    });
    return () => cleanup();
  }, []);

  // 2. Initialize or Restore Active Trip Session
  useEffect(() => {
    const existing = getLocalActiveTrip();

    if (existing && existing.status === "in_progress") {
      // Restore existing session
      setSession(existing);
      setMode(existing.mode || "bike");
      setDestination(existing.to || "Destination");
      setRouteType(existing.routeType || "eco");
      setPlannedDistance(existing.plannedDistance || 0);
      setActualDistance(existing.actualDistance || 0);
      setDurationSeconds(existing.durationSeconds || 0);
      setBreadcrumbs(existing.breadcrumbs || []);
      setIsTracking(true);
      setIsPaused(Boolean(existing.isPaused));
    } else if (initialTripState.to) {
      // Auto-start session with params from RoutePlanner
      startJourney({
        from: initialTripState.from || "My Location",
        to: initialTripState.to,
        mode: initialTripState.mode || "bike",
        routeType: initialTripState.routeType || "eco",
        plannedDistance: Number(initialTripState.plannedDistance || initialTripState.distance || 5),
        plannedDuration: Number(initialTripState.plannedDuration || initialTripState.duration || 15),
        plannedGeometry: initialTripState.geometry || null,
      });
    } else {
      // Prompt user to start a session or plan destination
      setShowQuickStartModal(true);
    }
  }, []);

  // 3. Initialize Mapbox
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/navigation-night-v1", // High contrast dark neo-hud map
      center: [72.8777, 19.076],
      zoom: 14,
      pitch: 45,
    });

    map.on("load", () => {
      // Setup breadcrumb polyline source
      map.addSource("breadcrumbs", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: [] },
        },
      });

      map.addLayer({
        id: "breadcrumbs-glow",
        type: "line",
        source: "breadcrumbs",
        paint: {
          "line-width": 8,
          "line-color": "#00F5D4",
          "line-blur": 4,
          "line-opacity": 0.8,
        },
      });

      map.addLayer({
        id: "breadcrumbs-line",
        type: "line",
        source: "breadcrumbs",
        paint: {
          "line-width": 4,
          "line-color": "#FFFFFF",
        },
      });

      // If planned geometry exists, add it
      if (initialTripState.geometry) {
        map.addSource("plannedRoute", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: initialTripState.geometry,
          },
        });

        map.addLayer({
          id: "plannedRoute",
          type: "line",
          source: "plannedRoute",
          paint: {
            "line-width": 5,
            "line-color": "#3A86FF",
            "line-opacity": 0.5,
            "line-dasharray": [2, 2],
          },
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 4. Center map and update marker when currentCoords change
  useEffect(() => {
    if (!currentCoords || !mapRef.current) return;
    const map = mapRef.current;

    // Create or update marker
    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "live-gps-beacon";
      el.innerHTML = `
        <div style="width: 22px; height: 22px; background: #00F5D4; border: 3px solid #14213D; border-radius: 50%; box-shadow: 0 0 15px #00F5D4;"></div>
        <div style="position: absolute; width: 44px; height: 44px; border: 2px solid #00F5D4; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; top: -11px; left: -11px; opacity: 0.6;"></div>
      `;

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([currentCoords.lng, currentCoords.lat])
        .addTo(map);

      map.flyTo({ center: [currentCoords.lng, currentCoords.lat], zoom: 15 });
    } else {
      userMarkerRef.current.setLngLat([currentCoords.lng, currentCoords.lat]);
    }
  }, [currentCoords]);

  // 5. Update Map Breadcrumbs layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.getSource && map.getSource("breadcrumbs")) {
      const coordinates = breadcrumbs.map((b) => [b.lng, b.lat]);
      map.getSource("breadcrumbs").setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates },
      });
    }
  }, [breadcrumbs]);

  // 6. Elapsed Duration Timer
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTracking, isPaused]);

  // 7. Periodic Cloud Checkpoint & Local Storage Auto-Sync (Battery Guard)
  useEffect(() => {
    if (!isTracking || !session) return;

    // Sync to local storage immediately
    const checkpointData = {
      ...session,
      actualDistance,
      durationSeconds,
      isPaused,
      breadcrumbs,
      batteryLevel: batteryInfo.level,
      lastHeartbeat: new Date().toISOString(),
    };
    saveLocalActiveTrip(checkpointData);

    // Periodic cloud heartbeat (every 15s normally, every 8s if low battery)
    const intervalMs = batteryInfo.isLowBattery ? 8000 : 15000;

    heartbeatIntervalRef.current = setInterval(async () => {
      setCheckpointStatus("Saving...");
      try {
        await apiRequest("/api/trips/live/checkpoint", "POST", {
          coords: currentCoords,
          actualDistance,
          durationSeconds,
          speed: currentSpeed,
          batteryLevel: batteryInfo.level,
          isPaused,
        });
        setCheckpointStatus("Guarded");
      } catch (err) {
        setCheckpointStatus("Local Protected");
      }
    }, intervalMs);

    return () => clearInterval(heartbeatIntervalRef.current);
  }, [isTracking, actualDistance, durationSeconds, isPaused, currentCoords, batteryInfo.level]);

  // 8. GPS WatchPosition Hook
  useEffect(() => {
    if (!isTracking || isPaused || simulationActive) {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed, accuracy } = pos.coords;
          const newCoord = { lat: latitude, lng: longitude };

          setCurrentCoords(newCoord);
          setCurrentSpeed(formatSpeedKmh(speed));

          // Evaluate accuracy
          if (accuracy < 15) setGpsAccuracy("High");
          else if (accuracy < 35) setGpsAccuracy("Good");
          else setGpsAccuracy("Low");

          // Accumulate distance with anti-jitter
          setBreadcrumbs((prev) => {
            const last = prev[prev.length - 1];
            if (isSignificantMovement(last, newCoord, 6)) {
              const updated = [...prev, newCoord];
              const totalKm = calculatePathDistance(updated);
              setActualDistance(totalKm);
              return updated;
            }
            return prev;
          });
        },
        (err) => {
          console.warn("GPS watch error:", err.message);
          setGpsAccuracy("Unavailable");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 2000,
        }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, isPaused, simulationActive]);

  // START JOURNEY FUNCTION
  const startJourney = async (params) => {
    try {
      const res = await apiRequest("/api/trips/live/start", "POST", {
        from: params.from || "My Location",
        to: params.to,
        mode: params.mode,
        routeType: params.routeType,
        plannedDistance: params.plannedDistance,
        plannedDuration: params.plannedDuration,
        batteryLevel: batteryInfo.level,
      });

      const sessionData = res?.session || {
        sessionId: `local_${Date.now()}`,
        ...params,
      };

      setSession(sessionData);
      setMode(params.mode);
      setDestination(params.to);
      setRouteType(params.routeType);
      setPlannedDistance(params.plannedDistance);
      setIsTracking(true);
      setIsPaused(false);
      setActualDistance(0);
      setDurationSeconds(0);
      setBreadcrumbs([]);
      saveLocalActiveTrip(sessionData);
      setShowQuickStartModal(false);

      // Get initial position
      navigator.geolocation.getCurrentPosition((pos) => {
        const initCoord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentCoords(initCoord);
        setBreadcrumbs([initCoord]);
      });
    } catch (err) {
      alert("Could not start live trip: " + err.message);
    }
  };

  // RECENTER CAMERA
  const handleRecenter = () => {
    if (currentCoords && mapRef.current) {
      mapRef.current.flyTo({
        center: [currentCoords.lng, currentCoords.lat],
        zoom: 16,
        pitch: 50,
      });
    }
  };

  // SIMULATE MOVEMENT (For desktop testing or when GPS is stationary)
  const toggleSimulation = () => {
    if (simulationActive) {
      clearInterval(simIntervalRef.current);
      setSimulationActive(false);
      return;
    }

    setSimulationActive(true);
    let step = 0;
    const baseLat = currentCoords ? currentCoords.lat : 19.076;
    const baseLng = currentCoords ? currentCoords.lng : 72.8777;

    simIntervalRef.current = setInterval(() => {
      step += 1;
      // Move north-east incrementally
      const simulatedLat = baseLat + step * 0.00035;
      const simulatedLng = baseLng + step * 0.00045;
      const newCoord = { lat: simulatedLat, lng: simulatedLng };

      setCurrentCoords(newCoord);
      setCurrentSpeed(mode === "bike" ? 18 : mode === "walk" ? 5 : 42);
      setGpsAccuracy("Simulated (High)");

      setBreadcrumbs((prev) => {
        const updated = [...prev, newCoord];
        setActualDistance(calculatePathDistance(updated));
        return updated;
      });
    }, 1500);
  };

  // TEST BATTERY CUTOFF (Simulate sudden power death)
  const handleOpenBatteryCutoffModal = () => {
    setShowBatteryCutoffModal(true);
  };

  const executeBatteryCutoff = () => {
    const currentDist = Math.max(actualDistance, 1.8);
    const currentDur = Math.max(durationSeconds, 420);
    const crashSnapshot = {
      ...(session || {}),
      mode,
      routeType,
      from: session?.from || "My Location",
      to: destination || "Destination",
      actualDistance: currentDist,
      durationSeconds: currentDur,
      lastHeartbeat: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      status: "in_progress",
    };
    saveLocalActiveTrip(crashSnapshot);
    setShowBatteryCutoffModal(false);
    navigate("/");
  };

  // CLOSE / EXIT TRACKER HANDLERS
  const handleCloseTracker = () => {
    if (actualDistance < 0.05) {
      // User just wanted to try or hasn't covered distance: exit immediately!
      discardAndExit();
    } else {
      // User has active progress recorded: prompt with options
      setShowExitModal(true);
    }
  };

  const discardAndExit = async () => {
    try {
      await apiRequest("/api/trips/live/active", "DELETE");
    } catch (_) {}
    clearLocalActiveTrip();
    setIsTracking(false);
    clearInterval(simIntervalRef.current);
    setShowExitModal(false);
    navigate("/");
  };

  const keepTrackingInBackground = () => {
    setShowExitModal(false);
    navigate("/");
  };

  // OPEN "FINISH EARLY" CONFIRMATION
  const handleInitiateEarlyFinish = async () => {
    setLoadingFinish(true);
    let stopName = "Current Location";

    if (currentCoords) {
      try {
        const geoRes = await geocodingClient
          .reverseGeocode({
            query: [currentCoords.lng, currentCoords.lat],
            limit: 1,
          })
          .send();
        if (geoRes?.body?.features?.length > 0) {
          stopName = geoRes.body.features[0].text || geoRes.body.features[0].place_name;
        }
      } catch (_) {}
    }

    setStoppingLocationName(stopName);
    setLoadingFinish(false);
    setConfirmEarlyFinish(true);
  };

  // FINALIZE TRIP (Early or Complete)
  const completeTrip = async (isPartial = false) => {
    setLoadingFinish(true);
    try {
      const durMin = Math.max(1, Math.round(durationSeconds / 60));
      const dist = Math.max(0.1, actualDistance);

      const res = await apiRequest("/api/trips/live/end", "POST", {
        actualDistance: dist,
        durationMinutes: durMin,
        mode,
        routeType,
        from: session?.from || "My Location",
        to: isPartial ? stoppingLocationName : destination,
        isPartial,
        stoppedEarly: isPartial,
        finalStopName: stoppingLocationName,
      });

      // Stop tracking and clean up
      setIsTracking(false);
      clearInterval(simIntervalRef.current);
      clearLocalActiveTrip();

      // Show reward celebration
      setRewardData(res.rewards || { pointsEarned: 25, co2Saved: 0.2, isEco: true });
      setShowRewardModal(true);
      setConfirmEarlyFinish(false);
    } catch (err) {
      alert("Failed to complete trip: " + err.message);
    } finally {
      setLoadingFinish(false);
    }
  };

  // CALCULATE LIVE ECO STATS
  const co2Rate = MODE_CO2_RATES[mode] ?? 0.192;
  const liveCo2Avoided =
    mode === "bike" || mode === "walk"
      ? Number((0.192 * actualDistance).toFixed(3))
      : routeType === "eco"
      ? Number((0.04 * actualDistance).toFixed(3))
      : 0;

  const livePoints = Math.max(
    5,
    Math.round(actualDistance * (mode === "walk" || mode === "bike" ? 15 : 6)) +
      (routeType === "eco" ? 20 : 5)
  );

  const ModeIcon = MODE_ICONS[mode] || Car;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: isMobile ? "calc(100dvh - 85px)" : "calc(100vh - 110px)",
        minHeight: isMobile ? "500px" : "680px",
        maxHeight: isMobile ? "100vh" : "920px",
        position: "relative",
        borderRadius: isMobile ? "16px" : "24px",
        overflow: "hidden",
        border: isMobile ? "3px solid #14213D" : "4px solid #14213D",
        boxShadow: isMobile ? "4px 4px 0px #14213D" : "8px 8px 0px #14213D",
      }}
    >
      {/* 1. TOP FLOATING HUD BAR */}
      <div
        style={{
          position: "absolute",
          top: isMobile ? "10px" : "16px",
          left: isMobile ? "10px" : "16px",
          right: isMobile ? "10px" : "16px",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {/* Left: Active Mode & Destination */}
        <div
          style={{
            pointerEvents: "auto",
            background: "rgba(20, 33, 61, 0.88)",
            backdropFilter: "blur(24px) saturate(140%)",
            WebkitBackdropFilter: "blur(24px) saturate(140%)",
            color: "#FFFFFF",
            padding: isMobile ? "6px 10px" : "10px 18px",
            borderRadius: isMobile ? "14px" : "18px",
            border: "2px solid rgba(0, 245, 212, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.15), 3px 3px 0px #14213D",
            maxWidth: isMobile ? "56%" : "auto",
          }}
        >
          <div
            style={{
              background: "#00F5D4",
              color: "#14213D",
              padding: isMobile ? "5px" : "8px",
              borderRadius: isMobile ? "8px" : "12px",
              display: "flex",
              flexShrink: 0,
            }}
          >
            <ModeIcon size={isMobile ? 16 : 20} strokeWidth={2.5} />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: isMobile ? "9px" : "11px", fontWeight: "800", color: "#00F5D4", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {routeType === "eco" ? "🌱 Eco Live" : "⚡ Live"}
            </div>
            <div style={{ fontSize: isMobile ? "13px" : "15px", fontWeight: "900", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {destination || "Open Destination"}
            </div>
          </div>
        </div>

        {/* Right: GPS, Battery Guard, Recenter & Exit Button */}
        <div style={{ pointerEvents: "auto", display: "flex", gap: isMobile ? "5px" : "8px", alignItems: "center" }}>
          {/* GPS Accuracy Pill (desktop only to save mobile space) */}
          {!isMobile && (
            <div
              style={{
                background: "rgba(20, 33, 61, 0.85)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                color: "#FFFFFF",
                padding: "8px 14px",
                borderRadius: "14px",
                border: "2px solid #3A86FF",
                fontSize: "12px",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.15), 2px 2px 0px #14213D",
              }}
            >
              <Crosshair size={14} color="#3A86FF" /> GPS: {gpsAccuracy}
            </div>
          )}

          {/* Battery Guard Status Pill */}
          <div
            title={`Battery: ${batteryInfo.level}% (${checkpointStatus})`}
            style={{
              background: batteryInfo.isLowBattery ? "#FEF2F2" : "rgba(20, 33, 61, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              color: batteryInfo.isLowBattery ? "#EF4444" : "#A7F3D0",
              padding: isMobile ? "6px 8px" : "8px 14px",
              borderRadius: isMobile ? "12px" : "14px",
              border: batteryInfo.isLowBattery ? "2px solid #EF4444" : "2px solid #10B981",
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.15), 2px 2px 0px #14213D",
            }}
          >
            {batteryInfo.charging ? (
              <BatteryCharging size={isMobile ? 14 : 16} />
            ) : batteryInfo.isLowBattery ? (
              <BatteryWarning size={isMobile ? 14 : 16} />
            ) : (
              <Battery size={isMobile ? 14 : 16} />
            )}
            <span>{batteryInfo.level}%</span>
            {!isMobile && <span style={{ fontSize: "10px", opacity: 0.8 }}>({checkpointStatus})</span>}
          </div>

          {/* Recenter Map Button */}
          <button
            onClick={handleRecenter}
            title="Recenter GPS Camera"
            style={{
              background: "#FFFFFF",
              color: "#14213D",
              border: "2px solid #14213D",
              borderRadius: isMobile ? "12px" : "14px",
              padding: isMobile ? "6px 8px" : "8px 12px",
              cursor: "pointer",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              boxShadow: "2px 2px 0px #14213D",
            }}
          >
            <Navigation size={isMobile ? 14 : 16} />
          </button>

          {/* DIRECT CLOSE / EXIT BUTTON */}
          <button
            onClick={handleCloseTracker}
            id="close-tracker-btn"
            title="Close / Exit Live Tracker"
            style={{
              background: "#EF4444",
              color: "#FFFFFF",
              border: "2px solid #14213D",
              borderRadius: isMobile ? "12px" : "14px",
              padding: isMobile ? "6px 10px" : "8px 14px",
              cursor: "pointer",
              fontWeight: "900",
              fontSize: isMobile ? "12px" : "13px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "2px 2px 0px #14213D",
            }}
          >
            <X size={isMobile ? 15 : 17} strokeWidth={3} />
            {!isMobile && <span>Exit</span>}
          </button>
        </div>
      </div>

      {/* 2. MAP VIEW */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", position: "relative" }} />

      {/* 3. BOTTOM HUD DASHBOARD (Compact Responsive Telemetry & Action Panel) */}
      <div
        style={{
          position: "absolute",
          bottom: isMobile ? "10px" : "16px",
          left: isMobile ? "10px" : "16px",
          right: isMobile ? "10px" : "16px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? "8px" : "12px",
          pointerEvents: "none",
        }}
      >
        {/* Telemetry Stats Grid */}
        <div
          style={{
            pointerEvents: "auto",
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(28px) saturate(130%)",
            WebkitBackdropFilter: "blur(28px) saturate(130%)",
            borderRadius: isMobile ? "16px" : "24px",
            border: isMobile ? "2.5px solid #14213D" : "3px solid #14213D",
            boxShadow: "inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 0 12px 30px rgba(20, 33, 61, 0.15), 4px 4px 0px #14213D",
            padding: isMobile ? "8px 12px" : "18px 24px",
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(auto-fit, minmax(130px, 1fr))",
            gap: isMobile ? "6px" : "16px",
            alignItems: "center",
          }}
        >
          {/* Speedometer */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "3px" : "6px", color: "var(--text-muted)", fontSize: isMobile ? "10px" : "12px", fontWeight: "700" }}>
              <Gauge size={isMobile ? 12 : 16} color="#3A86FF" /> {isMobile ? "Speed" : "Current Speed"}
            </div>
            <div style={{ fontSize: isMobile ? "1.15rem" : "1.8rem", fontWeight: "900", color: "#14213D", lineHeight: 1.1 }}>
              {currentSpeed} <span style={{ fontSize: isMobile ? "10px" : "13px", fontWeight: "700" }}>km/h</span>
            </div>
          </div>

          {/* Distance Traveled */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "3px" : "6px", color: "var(--text-muted)", fontSize: isMobile ? "10px" : "12px", fontWeight: "700" }}>
              <Compass size={isMobile ? 12 : 16} color="#059669" /> {isMobile ? "Dist" : "Distance"}
            </div>
            <div style={{ fontSize: isMobile ? "1.15rem" : "1.8rem", fontWeight: "900", color: "#14213D", lineHeight: 1.1 }}>
              {actualDistance.toFixed(2)}{" "}
              <span style={{ fontSize: isMobile ? "10px" : "13px", fontWeight: "700", color: "#64748b" }}>
                {plannedDistance > 0 ? `/ ${plannedDistance}km` : "km"}
              </span>
            </div>
          </div>

          {/* Elapsed Duration */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "3px" : "6px", color: "var(--text-muted)", fontSize: isMobile ? "10px" : "12px", fontWeight: "700" }}>
              <Clock size={isMobile ? 12 : 16} color="#CA8A04" /> Time
            </div>
            <div style={{ fontSize: isMobile ? "1.15rem" : "1.8rem", fontWeight: "900", color: "#14213D", lineHeight: 1.1 }}>
              {formatDuration(durationSeconds)}
            </div>
          </div>

          {/* Live Eco Points Accumulator */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "3px" : "6px", color: "#3A86FF", fontSize: isMobile ? "10px" : "12px", fontWeight: "700" }}>
              <Sparkles size={isMobile ? 12 : 16} color="#3A86FF" /> Points
            </div>
            <div style={{ fontSize: isMobile ? "1.15rem" : "1.8rem", fontWeight: "900", color: "#3A86FF", lineHeight: 1.1 }}>
              +{livePoints} <span style={{ fontSize: isMobile ? "10px" : "13px", fontWeight: "700" }}>XP</span>
            </div>
          </div>

          {/* Desktop-only: CO2 Avoided */}
          {!isMobile && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontSize: "12px", fontWeight: "700" }}>
                <Leaf size={16} color="#059669" /> CO₂ Saved
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#059669", lineHeight: 1.1 }}>
                +{liveCo2Avoided} <span style={{ fontSize: "13px", fontWeight: "700" }}>kg</span>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Buttons (Pause / Resume, Finish Early, Complete Journey) */}
        <div
          style={{
            pointerEvents: "auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "auto 1.1fr 1.2fr" : "auto 1fr 1fr",
            gap: isMobile ? "6px" : "10px",
            alignItems: "center",
          }}
        >
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume tracking" : "Pause tracking"}
            style={{
              background: isPaused ? "#10B981" : "#FFBE0B",
              color: "#14213D",
              border: isMobile ? "2px solid #14213D" : "3px solid #14213D",
              borderRadius: isMobile ? "12px" : "16px",
              padding: isMobile ? "8px 12px" : "10px 18px",
              fontWeight: "800",
              fontSize: isMobile ? "12px" : "14px",
              cursor: "pointer",
              boxShadow: "2.5px 2.5px 0px #14213D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {isPaused ? <Play size={isMobile ? 15 : 18} /> : <Pause size={isMobile ? 15 : 18} />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>

          {/* Finish Early (Stopped in Between) Button */}
          <button
            onClick={handleInitiateEarlyFinish}
            disabled={loadingFinish || actualDistance < 0.05}
            title={actualDistance < 0.05 ? "Travel at least 50m to record a partial trip" : "End journey at current stop and claim partial points"}
            style={{
              background: "#F97316",
              color: "#FFFFFF",
              border: isMobile ? "2px solid #14213D" : "3px solid #14213D",
              borderRadius: isMobile ? "12px" : "16px",
              padding: isMobile ? "8px 8px" : "10px 20px",
              fontWeight: "900",
              fontSize: isMobile ? "11.5px" : "14px",
              cursor: actualDistance < 0.05 ? "not-allowed" : "pointer",
              opacity: actualDistance < 0.05 ? 0.6 : 1,
              boxShadow: "2.5px 2.5px 0px #14213D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <Flag size={isMobile ? 14 : 18} />
            <span>{isMobile ? "Finish Early" : "Finish Early (Stopped Here)"}</span>
          </button>

          {/* Complete Full Trip Button */}
          <button
            onClick={() => completeTrip(false)}
            disabled={loadingFinish || actualDistance < 0.05}
            title={actualDistance < 0.05 ? "Travel at least 50m to complete journey" : "Complete journey and claim full eco rewards"}
            style={{
              background: "#10B981",
              color: "#FFFFFF",
              border: isMobile ? "2px solid #14213D" : "3px solid #14213D",
              borderRadius: isMobile ? "12px" : "16px",
              padding: isMobile ? "8px 10px" : "10px 22px",
              fontWeight: "900",
              fontSize: isMobile ? "11.5px" : "14px",
              cursor: actualDistance < 0.05 ? "not-allowed" : "pointer",
              opacity: actualDistance < 0.05 ? 0.6 : 1,
              boxShadow: "2.5px 2.5px 0px #14213D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <CheckCircle2 size={isMobile ? 14 : 18} />
            <span>{isMobile ? "Complete" : "Complete Journey"}</span>
          </button>
        </div>

        {/* Developer & Test Simulation Tools (Compact single row) */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: isMobile ? "6px" : "10px",
          }}
        >
          <button
            onClick={toggleSimulation}
            id="simulate-movement-btn"
            style={{
              flex: 1,
              background: simulationActive ? "#FF006E" : "#FFFFFF",
              color: simulationActive ? "#FFFFFF" : "#14213D",
              border: isMobile ? "2px solid #14213D" : "2.5px solid #14213D",
              borderRadius: isMobile ? "10px" : "14px",
              padding: isMobile ? "5px 8px" : "8px 14px",
              fontWeight: "800",
              fontSize: isMobile ? "10.5px" : "12px",
              cursor: "pointer",
              boxShadow: "2px 2px 0px #14213D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
            }}
          >
            <Zap size={isMobile ? 12 : 14} />
            <span>{simulationActive ? "Stop Sim" : "Simulate Movement"}</span>
          </button>

          <button
            onClick={handleOpenBatteryCutoffModal}
            id="test-battery-cutoff-btn"
            title="Test sudden power loss or battery death"
            style={{
              flex: 1,
              background: "#FEF2F2",
              color: "#EF4444",
              border: isMobile ? "2px solid #14213D" : "2.5px solid #14213D",
              borderRadius: isMobile ? "10px" : "14px",
              padding: isMobile ? "5px 8px" : "8px 14px",
              fontWeight: "800",
              fontSize: isMobile ? "10.5px" : "12px",
              cursor: "pointer",
              boxShadow: "2px 2px 0px #14213D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
            }}
          >
            <BatteryWarning size={isMobile ? 12 : 14} />
            <span>Test Battery Cutoff</span>
          </button>
        </div>
      </div>

      {/* 4. CONFIRM EARLY FINISH (STOPPED IN BETWEEN) MODAL */}
      <AnimatePresence>
        {confirmEarlyFinish && (
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
              padding: "16px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(28px) saturate(130%)",
                WebkitBackdropFilter: "blur(28px) saturate(130%)",
                borderRadius: "24px",
                border: "3.5px solid #14213D",
                boxShadow: "inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 8px 8px 0px #14213D",
                maxWidth: "480px",
                width: "100%",
                padding: isMobile ? "20px" : "26px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#FEF3C7",
                  border: "2px solid #F59E0B",
                  color: "#B45309",
                  padding: "4px 12px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "12px",
                  marginBottom: "14px",
                }}
              >
                <Flag size={14} /> STOPPING IN BETWEEN
              </div>

              <h2 style={{ fontSize: isMobile ? "1.3rem" : "1.5rem", fontWeight: "900", color: "#14213D", margin: "0 0 10px" }}>
                Finish Journey Early?
              </h2>

              <p style={{ color: "#475569", fontSize: isMobile ? "13px" : "14.5px", lineHeight: "1.5", margin: "0 0 18px" }}>
                You completed <strong>{actualDistance.toFixed(2)} km</strong> of your journey and stopped near{" "}
                <strong style={{ color: "#14213D" }}>{stoppingLocationName}</strong>.
                We will pro-rate your points and CO₂ savings based on the actual distance completed!
              </p>

              {/* Summary Stats */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  background: "#F8FAFC",
                  padding: isMobile ? "10px" : "14px",
                  borderRadius: "14px",
                  border: "2px solid #14213D",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>Actual Distance</span>
                  <div style={{ fontSize: isMobile ? "1.1rem" : "1.2rem", fontWeight: "900", color: "#14213D" }}>
                    {actualDistance.toFixed(2)} km
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>Time Taken</span>
                  <div style={{ fontSize: isMobile ? "1.1rem" : "1.2rem", fontWeight: "900", color: "#14213D" }}>
                    {formatDuration(durationSeconds)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>Pro-rated Points</span>
                  <div style={{ fontSize: isMobile ? "1.1rem" : "1.2rem", fontWeight: "900", color: "#059669" }}>
                    +{livePoints} XP
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setConfirmEarlyFinish(false)}
                  style={{
                    flex: 1,
                    background: "#FFFFFF",
                    color: "#14213D",
                    border: "2.5px solid #14213D",
                    borderRadius: "14px",
                    padding: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Continue Journey
                </button>
                <button
                  onClick={() => completeTrip(true)}
                  disabled={loadingFinish}
                  style={{
                    flex: 1.4,
                    background: "#10B981",
                    color: "#FFFFFF",
                    border: "2.5px solid #14213D",
                    borderRadius: "14px",
                    padding: "12px",
                    fontWeight: "900",
                    cursor: "pointer",
                    boxShadow: "3px 3px 0px #14213D",
                  }}
                >
                  {loadingFinish ? "Saving Trip..." : "Save & Claim Points"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. TEST BATTERY CUTOFF MODAL (Liquid Glass) */}
      <AnimatePresence>
        {showBatteryCutoffModal && (
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
              background: "rgba(20, 33, 61, 0.65)",
              backdropFilter: "blur(12px) saturate(140%)",
              WebkitBackdropFilter: "blur(12px) saturate(140%)",
              zIndex: 99995,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(28px) saturate(140%)",
                WebkitBackdropFilter: "blur(28px) saturate(140%)",
                borderRadius: "24px",
                border: "3.5px solid #14213D",
                boxShadow: "inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 8px 8px 0px #14213D",
                maxWidth: "460px",
                width: "100%",
                padding: isMobile ? "20px" : "26px",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowBatteryCutoffModal(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "#F1F5F9",
                  border: "2px solid #14213D",
                  borderRadius: "10px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                  color: "#14213D",
                }}
              >
                <X size={16} />
              </button>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#FEE2E2",
                  border: "2px solid #EF4444",
                  color: "#B91C1C",
                  padding: "4px 12px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "12px",
                  marginBottom: "14px",
                }}
              >
                <BatteryWarning size={14} /> BATTERY CUTOFF SIMULATION
              </div>

              <h2 style={{ fontSize: isMobile ? "1.3rem" : "1.45rem", fontWeight: "900", color: "#14213D", margin: "0 0 10px" }}>
                Simulate Sudden Power Cutoff?
              </h2>

              <p style={{ color: "#475569", fontSize: isMobile ? "12.5px" : "13.5px", lineHeight: "1.5", margin: "0 0 18px" }}>
                TripChain continuously saves your live journey coordinates to Battery-Guard local checkpoints every 5 seconds.
                Triggering this cutoff simulates your phone suddenly running out of battery or crashing mid-commute.
              </p>

              {/* Snapshot Preview Card */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "2px solid #14213D",
                  borderRadius: "16px",
                  padding: isMobile ? "10px 14px" : "12px 16px",
                  marginBottom: "20px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>Checkpointed Distance</span>
                  <div style={{ fontSize: isMobile ? "1.1rem" : "1.2rem", fontWeight: "900", color: "#14213D" }}>
                    {actualDistance.toFixed(2)} km
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>Elapsed Duration</span>
                  <div style={{ fontSize: isMobile ? "1.1rem" : "1.2rem", fontWeight: "900", color: "#14213D" }}>
                    {formatDuration(durationSeconds)}
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #E2E8F0", paddingTop: "8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#059669", fontWeight: "700" }}>
                  <ShieldCheck size={14} /> Auto-restorable via banner on home page
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setShowBatteryCutoffModal(false)}
                  style={{
                    flex: 1,
                    background: "#FFFFFF",
                    color: "#14213D",
                    border: "2.5px solid #14213D",
                    borderRadius: "14px",
                    padding: "11px",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeBatteryCutoff}
                  id="confirm-battery-cutoff-btn"
                  style={{
                    flex: 1.4,
                    background: "#EF4444",
                    color: "#FFFFFF",
                    border: "2.5px solid #14213D",
                    borderRadius: "14px",
                    padding: "11px",
                    fontWeight: "900",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "3px 3px 0px #14213D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <BatteryWarning size={16} /> Cut Power Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. EXIT / CLOSE TRACKER MODAL */}
      <AnimatePresence>
        {showExitModal && (
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
              background: "rgba(20, 33, 61, 0.65)",
              backdropFilter: "blur(12px) saturate(140%)",
              WebkitBackdropFilter: "blur(12px) saturate(140%)",
              zIndex: 99995,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(28px) saturate(140%)",
                WebkitBackdropFilter: "blur(28px) saturate(140%)",
                borderRadius: "24px",
                border: "3.5px solid #14213D",
                boxShadow: "inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 8px 8px 0px #14213D",
                maxWidth: "460px",
                width: "100%",
                padding: isMobile ? "20px" : "26px",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowExitModal(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "#F1F5F9",
                  border: "2px solid #14213D",
                  borderRadius: "10px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                  color: "#14213D",
                }}
              >
                <X size={16} />
              </button>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#F1F5F9",
                  border: "2px solid #14213D",
                  color: "#14213D",
                  padding: "4px 12px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "12px",
                  marginBottom: "14px",
                }}
              >
                <LogOut size={14} /> EXIT LIVE TRACKER
              </div>

              <h2 style={{ fontSize: isMobile ? "1.3rem" : "1.45rem", fontWeight: "900", color: "#14213D", margin: "0 0 10px" }}>
                Leave Active Tracking?
              </h2>

              <p style={{ color: "#475569", fontSize: isMobile ? "12.5px" : "13.5px", lineHeight: "1.5", margin: "0 0 18px" }}>
                You have traveled <strong>{actualDistance.toFixed(2)} km</strong> over <strong>{formatDuration(durationSeconds)}</strong>. Choose how you'd like to exit:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {/* Option A: Save and Complete Early */}
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    completeTrip(true);
                  }}
                  id="exit-save-btn"
                  style={{
                    background: "#10B981",
                    color: "#FFFFFF",
                    border: "2.5px solid #14213D",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    fontWeight: "900",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    boxShadow: "3px 3px 0px #14213D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} /> Save Progress & Claim Points
                  </span>
                  <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "8px", fontSize: "12px" }}>
                    +{livePoints} XP
                  </span>
                </button>

                {/* Option B: Keep tracking in background */}
                <button
                  onClick={keepTrackingInBackground}
                  id="exit-background-btn"
                  style={{
                    background: "#3A86FF",
                    color: "#FFFFFF",
                    border: "2.5px solid #14213D",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    fontWeight: "900",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    boxShadow: "3px 3px 0px #14213D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Navigation size={16} /> Track in Background
                  </span>
                  <span style={{ fontSize: "11px", opacity: 0.9 }}>Floating Banner</span>
                </button>

                {/* Option C: Discard and Exit */}
                <button
                  onClick={discardAndExit}
                  id="exit-discard-btn"
                  style={{
                    background: "#FFF1F2",
                    color: "#E11D48",
                    border: "2px solid #E11D48",
                    borderRadius: "14px",
                    padding: "10px 16px",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Trash2 size={15} /> Discard Journey & Exit
                </button>
              </div>

              <button
                onClick={() => setShowExitModal(false)}
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  color: "#64748b",
                  border: "2px solid #CBD5E1",
                  borderRadius: "12px",
                  padding: "9px",
                  fontWeight: "700",
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                Resume Current Journey
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. QUICK START MODAL (If entering /track directly without route planning) */}
      <AnimatePresence>
        {showQuickStartModal && !session && (
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
              padding: "16px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(28px) saturate(130%)",
                WebkitBackdropFilter: "blur(28px) saturate(130%)",
                borderRadius: "24px",
                border: "3.5px solid #14213D",
                boxShadow: "inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 8px 8px 0px #14213D",
                maxWidth: "480px",
                width: "100%",
                padding: isMobile ? "22px 18px" : "28px",
                position: "relative",
              }}
            >
              {/* Close Button for Quick Start Modal */}
              <button
                onClick={() => navigate("/")}
                id="quick-start-close-btn"
                title="Cancel & return to home"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "#F1F5F9",
                  border: "2px solid #14213D",
                  borderRadius: "10px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                  color: "#14213D",
                }}
              >
                <X size={18} />
              </button>

              <h2 style={{ fontSize: isMobile ? "1.4rem" : "1.6rem", fontWeight: "900", color: "#14213D", margin: "0 0 8px" }}>
                Start Live Expedition
              </h2>
              <p style={{ color: "#64748b", fontSize: isMobile ? "13px" : "14px", margin: "0 0 18px" }}>
                Track your commute in real time. We guarantee zero progress loss with continuous Battery-Guard checkpointing!
              </p>

              {/* Destination Input */}
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "800", fontSize: "13px", color: "#14213D", marginBottom: "14px" }}>
                Target Destination (Optional)
                <input
                  type="text"
                  placeholder="e.g. Office, Central Park, or Free Roam"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "2.5px solid #14213D",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </label>

              {/* Mode Selection */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {["bike", "walk", "car", "transit"].map((m) => {
                  const isSelected = mode === m;
                  const Icon = MODE_ICONS[m] || Car;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      style={{
                        flex: 1,
                        padding: isMobile ? "8px 4px" : "10px",
                        borderRadius: "12px",
                        border: "2.5px solid #14213D",
                        background: isSelected ? "#3A86FF" : "#FFFFFF",
                        color: isSelected ? "#FFFFFF" : "#14213D",
                        fontWeight: "800",
                        fontSize: isMobile ? "11px" : "12px",
                        textTransform: "capitalize",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Icon size={isMobile ? 16 : 18} /> {m}
                    </button>
                  );
                })}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => navigate("/planner")}
                  style={{
                    flex: 1,
                    background: "#FFFFFF",
                    color: "#14213D",
                    border: "2.5px solid #14213D",
                    borderRadius: "14px",
                    padding: "12px",
                    fontWeight: "800",
                    fontSize: isMobile ? "12px" : "14px",
                    cursor: "pointer",
                  }}
                >
                  Plan Full Route
                </button>
                <button
                  onClick={() =>
                    startJourney({
                      from: "My Location",
                      to: destination.trim() || "Free Roam Expedition",
                      mode,
                      routeType: "eco",
                      plannedDistance: 5,
                      plannedDuration: 15,
                    })
                  }
                  id="quick-start-track-btn"
                  style={{
                    flex: 1.4,
                    background: "#10B981",
                    color: "#FFFFFF",
                    border: "2.5px solid #14213D",
                    borderRadius: "14px",
                    padding: "12px",
                    fontWeight: "900",
                    fontSize: isMobile ? "12px" : "14px",
                    cursor: "pointer",
                    boxShadow: "3px 3px 0px #14213D",
                  }}
                >
                  Start Tracking Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. REWARD CELEBRATION MODAL */}
      <RouteRewardModal
        isOpen={showRewardModal}
        onClose={() => {
          setShowRewardModal(false);
          navigate("/insights");
        }}
        rewardData={rewardData}
      />
    </div>
  );
}
