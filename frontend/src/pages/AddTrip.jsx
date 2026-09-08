import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, X, Check, Car, Bus, Train, Bike, Footprints, 
  CarTaxiFront, Leaf, Zap, CheckCircle2 
} from "lucide-react";
import RouteRewardModal from "../components/RouteRewardModal";
import mapboxgl from "mapbox-gl";
import mbxDirections from "@mapbox/mapbox-sdk/services/directions";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import "../styles/addtrip.css";

// Use environment variable for the mapbox token
if (process.env.REACT_APP_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
}

const directionsClient = mapboxgl.accessToken ? mbxDirections({ accessToken: mapboxgl.accessToken }) : null;
const geocodingClient = mapboxgl.accessToken ? mbxGeocoding({ accessToken: mapboxgl.accessToken }) : null;

const AddTrip = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("car");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState("");
  const [routeType, setRouteType] = useState("eco"); // "eco" | "fastest"
  const [fastestOption, setFastestOption] = useState(null);
  const [ecoOption, setEcoOption] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  // Auto-calculate distance & duration when from, to, mode change
  useEffect(() => {
    if (!from.trim() || !to.trim() || !directionsClient || !geocodingClient) return;

    const fetchRoute = async () => {
      try {
        const geoFrom = await geocodingClient.forwardGeocode({ query: from, limit: 1 }).send();
        const geoTo = await geocodingClient.forwardGeocode({ query: to, limit: 1 }).send();

        if (!geoFrom.body.features.length || !geoTo.body.features.length) return;

        const [lngFrom, latFrom] = geoFrom.body.features[0].center;
        const [lngTo, latTo] = geoTo.body.features[0].center;

        const profile = "driving";

        const dir = await directionsClient.getDirections({
          profile,
          geometries: "geojson",
          alternatives: true,
          waypoints: [
            { coordinates: [lngFrom, latFrom] },
            { coordinates: [lngTo, latTo] },
          ],
        }).send();

        if (dir.body.routes.length > 0) {
          const routes = dir.body.routes;
          const fastest = [...routes].sort((a, b) => a.duration - b.duration)[0];
          let ecoCandidate = routes.length > 1 
            ? [...routes].sort((a, b) => a.distance - b.distance)[0] 
            : null;

          if (ecoCandidate && ecoCandidate.distance >= fastest.distance && routes.length > 1) {
            ecoCandidate = routes.find((r) => r !== fastest) || ecoCandidate;
          }

          const getAdjustedDuration = (baseSeconds) => {
            let durationMin = baseSeconds / 60;
            if (mode === "bus") durationMin *= 1.5;
            else if (mode === "train") durationMin *= 0.7;
            else if (mode === "bike") durationMin *= 3.5;
            else if (mode === "walk" || mode === "footprints") durationMin *= 10.0;
            return Math.round(durationMin);
          };

          const fastDist = (fastest.distance / 1000).toFixed(1);
          const fastDur = getAdjustedDuration(fastest.duration).toString();

          let ecoDist, ecoDur;
          if (ecoCandidate && (ecoCandidate.distance < fastest.distance || ecoCandidate.duration !== fastest.duration)) {
            ecoDist = (ecoCandidate.distance / 1000).toFixed(1);
            ecoDur = getAdjustedDuration(ecoCandidate.duration).toString();
          } else {
            ecoDist = fastDist;
            ecoDur = Math.max(Number(fastDur) + 2, Math.round(Number(fastDur) * 1.06)).toString();
          }

          setFastestOption({ distance: fastDist, duration: fastDur });
          setEcoOption({ distance: ecoDist, duration: ecoDur });

          if (routeType === "eco") {
            setDistance(ecoDist);
            setDuration(ecoDur);
          } else {
            setDistance(fastDist);
            setDuration(fastDur);
          }
        }
      } catch (err) {
        console.error("Auto-calculate failed:", err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchRoute();
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [from, to, mode, routeType]);

  const handleSelectRouteType = (type) => {
    setRouteType(type);
    if (type === "eco" && ecoOption) {
      setDistance(ecoOption.distance);
      setDuration(ecoOption.duration);
    } else if (type === "fastest" && fastestOption) {
      setDistance(fastestOption.distance);
      setDuration(fastestOption.duration);
    }
  };

  const [showDateModal, setShowDateModal] = useState(false);
  const [day, setDay] = useState(new Date().getDate());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [hour, setHour] = useState(new Date().getHours());
  const [minute, setMinute] = useState(new Date().getMinutes());

  const navigate = useNavigate();

  const handleAddTrip = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const isEco = routeType === "eco";
    const co2Saved = isEco && fastestOption && Number(distance) < Number(fastestOption.distance)
      ? Number(((Number(fastestOption.distance) - Number(distance)) * 0.192).toFixed(2))
      : isEco ? 0.05 : 0;

    try {
      const res = await apiRequest("/api/trips", "POST", {
        from,
        to,
        mode,
        distance: Number(distance),
        duration: Number(duration),
        routeType,
        co2Saved,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      });

      setRewardData(res?.rewards || {
        isEco,
        pointsEarned: isEco ? 50 : 10,
        co2Saved,
        newBadges: [],
      });
      setShowRewardModal(true);
    } catch (err) {
      setError(err.message || "Failed to add trip");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModal = () => {
    try {
      const d = new Date(year, month - 1, day, hour, minute);
      setDate(d.toISOString());
      setShowDateModal(false);
    } catch {
      setError("Please select a valid date and time");
    }
  };

  const isEcoSelected = routeType === "eco";

  return (
    <motion.div 
      style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "clamp(20px, 4vw, 40px) clamp(10px, 3vw, 20px)", width: "100%", boxSizing: "border-box" }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, transition: { type: "spring", bounce: 0.5 } }}
    >
      <div style={{ maxWidth: "800px", width: "100%", padding: "clamp(20px, 4vw, 40px)", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "4px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", boxSizing: "border-box" }}>
        <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", fontSize: "clamp(1.8rem, 5vw, 2.5rem)", color: "#14213D", marginBottom: "8px", textAlign: "center" }}>
          Add a New Trip
        </h1>
        <p style={{ textAlign: "center", fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)", color: "var(--text-muted)", fontWeight: "600", marginBottom: "32px" }}>
          Record your journey, choose your route strategy, and earn sustainability rewards.
        </p>

        <form onSubmit={handleAddTrip} style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
              From
              <input 
                type="text" required value={from} onChange={(e) => setFrom(e.target.value)} 
                placeholder="e.g. Home"
                style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)", boxSizing: "border-box" }}
                onFocus={(e) => { e.target.style.borderColor = "#3A86FF"; e.target.style.background = "#FFFFFF"; }}
                onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
              To
              <input 
                type="text" required value={to} onChange={(e) => setTo(e.target.value)} 
                placeholder="e.g. Office"
                style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)", boxSizing: "border-box" }}
                onFocus={(e) => { e.target.style.borderColor = "#3A86FF"; e.target.style.background = "#FFFFFF"; }}
                onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; }}
              />
            </label>
          </div>

          {/* ROUTE TYPE SELECTION (FASTEST VS ECO) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
            <label style={{ fontWeight: "bold", color: "#14213D", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
              <span>Route Selection</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Choose route option to earn rewards</span>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "16px" }}>
              {/* Eco Route */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectRouteType("eco")}
                style={{
                  padding: "18px 20px",
                  borderRadius: "18px",
                  border: isEcoSelected ? "3px solid #059669" : "3px solid #14213D",
                  background: isEcoSelected ? "#D1FAE5" : "#F8FAFC",
                  boxShadow: isEcoSelected ? "4px 4px 0px #059669" : "2px 2px 0px #14213D",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontWeight: "800", fontSize: "1.1rem" }}>
                    <Leaf size={22} /> Eco Route
                    <span style={{ background: "#10B981", color: "#FFFFFF", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "8px", fontWeight: "bold" }}>
                      +50 PTS
                    </span>
                  </span>
                  {isEcoSelected ? (
                    <span style={{ color: "#059669", fontWeight: "800", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "3px" }}>
                      <CheckCircle2 size={18} /> Selected
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700" }}>Select</span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: "0.85rem", color: "#065F46", fontWeight: "600" }}>
                  Optimized for fuel efficiency, lower emissions, and green travel.
                </p>

                {ecoOption && (
                  <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#14213D", marginTop: "4px" }}>
                    Est: {ecoOption.distance} km • {ecoOption.duration} min
                  </div>
                )}
              </motion.div>

              {/* Fastest Route */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectRouteType("fastest")}
                style={{
                  padding: "18px 20px",
                  borderRadius: "18px",
                  border: !isEcoSelected ? "3px solid #2563EB" : "3px solid #14213D",
                  background: !isEcoSelected ? "#DBEAFE" : "#F8FAFC",
                  boxShadow: !isEcoSelected ? "4px 4px 0px #2563EB" : "2px 2px 0px #14213D",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#3A86FF", fontWeight: "800", fontSize: "1.1rem" }}>
                    <Zap size={22} /> Fastest Route
                    <span style={{ background: "#3A86FF", color: "#FFFFFF", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "8px", fontWeight: "bold" }}>
                      +10 PTS
                    </span>
                  </span>
                  {!isEcoSelected ? (
                    <span style={{ color: "#2563EB", fontWeight: "800", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "3px" }}>
                      <CheckCircle2 size={18} /> Selected
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700" }}>Select</span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: "0.85rem", color: "#1E40AF", fontWeight: "600" }}>
                  Direct shortest-duration route prioritizing speed.
                </p>

                {fastestOption && (
                  <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#14213D", marginTop: "4px" }}>
                    Est: {fastestOption.distance} km • {fastestOption.duration} min
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <label style={{ fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>Mode of Travel</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 82px), 1fr))", gap: "10px" }}>
              {[
                { id: "car", icon: Car, label: "Car", color: "#3A86FF" },
                { id: "bus", icon: Bus, label: "Bus", color: "#8338EC" },
                { id: "train", icon: Train, label: "Train", color: "#FF5400" },
                { id: "bike", icon: Bike, label: "Bike", color: "#FF006E" },
                { id: "walk", icon: Footprints, label: "Walk", color: "#FFBE0B" },
                { id: "cab", icon: CarTaxiFront, label: "Cab", color: "#38B000" }
              ].map(m => (
                <motion.button
                  whileHover={{ y: -4 }} whileTap={{ y: 2 }}
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                    padding: "clamp(10px, 2vw, 16px)", borderRadius: "16px", border: "3px solid #14213D",
                    background: mode === m.id ? m.color : "#FFFFFF",
                    color: mode === m.id ? "#FFFFFF" : "#14213D",
                    boxShadow: mode === m.id ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D",
                    transition: "all 0.2s", cursor: "pointer", fontWeight: "bold",
                    boxSizing: "border-box",
                  }}
                >
                  <m.icon size={26} />
                  <span style={{ fontSize: "clamp(12px, 2.5vw, 14px)" }}>{m.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "16px", width: "100%" }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
              Distance (km)
              <input 
                type="number" required min="0" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} 
                style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)", boxSizing: "border-box" }}
                onFocus={(e) => { e.target.style.borderColor = "#3A86FF"; e.target.style.background = "#FFFFFF"; }}
                onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; }}
              />
            </label>

            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
              Duration (min)
              <input 
                type="number" required min="0" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} 
                style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)", boxSizing: "border-box" }}
                onFocus={(e) => { e.target.style.borderColor = "#3A86FF"; e.target.style.background = "#FFFFFF"; }}
                onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; }}
              />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
            Date & Time
            <motion.div 
              whileHover={{ y: -2 }} whileTap={{ y: 1 }}
              onClick={() => { setShowDateModal(true); setError(""); }}
              style={{
                background: "#F8FAFC", border: "3px solid #14213D", padding: "16px", borderRadius: "16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "10px", boxShadow: "4px 4px 0px #14213D", fontSize: "16px"
              }}
            >
              <Calendar size={20} color="#3A86FF" />
              {date ? new Date(date).toLocaleString() : "Select Date & Time (Default: Now)"}
            </motion.div>
          </label>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: "auto"}} exit={{opacity: 0, height: 0}}
                style={{ color: '#EF4444', background: "#FEF2F2", padding: "16px", borderRadius: "16px", border: "3px solid #FCA5A5", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ y: -4 }} whileTap={{ y: 2 }}
            type="submit"
            disabled={loading}
            style={{ 
              width: "100%", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              gap: "10px", 
              padding: "18px", 
              fontSize: "1.2rem", 
              fontWeight: "bold", 
              borderRadius: "16px", 
              background: isEcoSelected ? "#10B981" : "#3A86FF", 
              color: "#FFFFFF", 
              border: "3px solid #14213D", 
              boxShadow: "4px 4px 0px #14213D", 
              marginTop: "16px",
              cursor: "pointer",
            }}
          >
            {isEcoSelected ? <Leaf size={24} /> : <Zap size={24} />}
            {loading 
              ? "Saving Trip..." 
              : isEcoSelected 
                ? "Save Eco Trip (+50 Points)" 
                : "Save Fastest Trip (+10 Points)"}
          </motion.button>
        </form>
      </div>

      {/* CUSTOM DATE/TIME MODAL */}
      <AnimatePresence>
        {showDateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(20, 33, 61, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card"
              style={{
                background: "#FDFCDC",
                padding: "clamp(18px, 4vw, 24px)",
                width: "min(92vw, 420px)",
                maxHeight: "90vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                border: "3px solid #14213D",
                borderRadius: "20px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", fontSize: "clamp(1.1rem, 3vw, 1.3rem)" }}>
                  <Calendar size={20} /> Pick Date & Time
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "40px", minHeight: "40px" }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontWeight: "600" }}>Date</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", border: "3px solid #14213D", padding: "10px", borderRadius: "12px", flexWrap: "wrap" }}>
                  <Calendar size={18} color="var(--primary)" />
                  <select value={day} onChange={e => setDay(e.target.value)} style={{ appearance: "none", border: "none", outline: "none", background: "transparent", fontSize: "16px", fontWeight: "bold", paddingRight: "6px", cursor: "pointer" }}>
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <span style={{color: "#cbd5e1"}}>/</span>
                  <select value={month} onChange={e => setMonth(e.target.value)} style={{ appearance: "none", border: "none", outline: "none", background: "transparent", fontSize: "16px", fontWeight: "bold", paddingRight: "6px", cursor: "pointer" }}>
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>)}
                  </select>
                  <span style={{color: "#cbd5e1"}}>/</span>
                  <select value={year} onChange={e => setYear(e.target.value)} style={{ appearance: "none", border: "none", outline: "none", background: "transparent", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
                    {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontWeight: "600" }}>Time</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", border: "3px solid #14213D", padding: "10px", borderRadius: "12px", flexWrap: "wrap" }}>
                  <Clock size={18} color="var(--primary)" />
                  <select value={hour} onChange={e => setHour(e.target.value)} style={{ appearance: "none", border: "none", outline: "none", background: "transparent", fontSize: "16px", fontWeight: "bold", paddingRight: "6px", cursor: "pointer" }}>
                    {Array.from({length: 24}, (_, i) => i).map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>)}
                  </select>
                  <span style={{fontWeight: "bold"}}>:</span>
                  <select value={minute} onChange={e => setMinute(e.target.value)} style={{ appearance: "none", border: "none", outline: "none", background: "transparent", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
                    {Array.from({length: 60}, (_, i) => i).map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                  </select>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleSaveModal}
                className="btn btn-primary"
                style={{ display: "flex", justifyContent: "center", gap: "8px", width: "100%", marginTop: "10px" }}
              >
                <Check size={20} /> Confirm
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REWARD CELEBRATION MODAL */}
      <RouteRewardModal 
        isOpen={showRewardModal} 
        onClose={() => {
          setShowRewardModal(false);
          navigate("/");
        }} 
        rewardData={rewardData}
      />
    </motion.div>
  );
};

export default AddTrip;
