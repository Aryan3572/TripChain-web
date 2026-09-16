// src/utils/geoUtils.js

const ACTIVE_TRIP_STORAGE_KEY = "tripchain_active_trip_session";
const RECOVERED_ALERT_DISMISSED_KEY = "tripchain_recovered_alert_dismissed";

/**
 * Calculates great-circle distance between two points in kilometers (Haversine formula)
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates total distance of an array of coordinates in km
 * Coordinates can be [{lat, lng}] or [[lng, lat]]
 */
export function calculatePathDistance(coords) {
  if (!coords || coords.length < 2) return 0;
  let totalKm = 0;

  for (let i = 1; i < coords.length; i++) {
    const p1 = coords[i - 1];
    const p2 = coords[i];

    const lat1 = Array.isArray(p1) ? p1[1] : p1.lat;
    const lon1 = Array.isArray(p1) ? p1[0] : p1.lng;
    const lat2 = Array.isArray(p2) ? p2[1] : p2.lat;
    const lon2 = Array.isArray(p2) ? p2[0] : p2.lng;

    if (lat1 != null && lon1 != null && lat2 != null && lon2 != null) {
      totalKm += haversineDistance(lat1, lon1, lat2, lon2);
    }
  }

  return Number(totalKm.toFixed(3));
}

/**
 * Filters GPS jitter: only records move if displacement >= minMeters
 */
export function isSignificantMovement(prev, current, minMeters = 8) {
  if (!prev) return true;
  const distKm = haversineDistance(prev.lat, prev.lng, current.lat, current.lng);
  return distKm * 1000 >= minMeters;
}

/**
 * Format seconds to 00:00 or 00:00:00
 */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n) => String(n).padStart(2, "0");

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Convert speed in m/s to km/h with a minimum floor
 */
export function formatSpeedKmh(speedMps) {
  if (!speedMps || speedMps < 0.2) return 0;
  return Math.round(speedMps * 3.6);
}

/**
 * Battery status monitor helper
 * Uses Web Battery API if available; returns cleanup function
 */
export async function initBatteryMonitor(onUpdate) {
  if (typeof navigator !== "undefined" && "getBattery" in navigator) {
    try {
      const battery = await navigator.getBattery();

      const report = () => {
        const levelPercent = Math.round((battery.level || 1) * 100);
        onUpdate({
          supported: true,
          level: levelPercent,
          charging: Boolean(battery.charging),
          isLowBattery: levelPercent <= 20,
          isCritical: levelPercent <= 5,
        });
      };

      report();

      battery.addEventListener("levelchange", report);
      battery.addEventListener("chargingchange", report);

      return () => {
        try {
          battery.removeEventListener("levelchange", report);
          battery.removeEventListener("chargingchange", report);
        } catch (_) {}
      };
    } catch (e) {
      console.warn("Battery API error:", e);
    }
  }

  // Fallback for browsers without Battery API
  onUpdate({
    supported: false,
    level: 100,
    charging: true,
    isLowBattery: false,
    isCritical: false,
  });

  return () => {};
}

/**
 * Local storage session checkpoint helpers
 */
export function saveLocalActiveTrip(session) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      ...session,
      savedAt: Date.now(),
    };
    localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to persist trip checkpoint locally:", err);
  }
}

export function getLocalActiveTrip() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);

    // If session is older than 48 hours, discard it
    if (session.savedAt && Date.now() - session.savedAt > 48 * 3600 * 1000) {
      clearLocalActiveTrip();
      return null;
    }

    return session;
  } catch (err) {
    return null;
  }
}

export function clearLocalActiveTrip() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY);
  } catch (_) {}
}

export function setRecoveredAlertDismissed(dismissed = true) {
  if (typeof window === "undefined") return;
  if (dismissed) {
    sessionStorage.setItem(RECOVERED_ALERT_DISMISSED_KEY, "true");
  } else {
    sessionStorage.removeItem(RECOVERED_ALERT_DISMISSED_KEY);
  }
}

export function isRecoveredAlertDismissed() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(RECOVERED_ALERT_DISMISSED_KEY) === "true";
}
