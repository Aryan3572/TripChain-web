import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, X, Check, Car, Bus, Train, Bike, Footprints, CarTaxiFront } from "lucide-react";
import NotificationModal from "../components/NotificationModal";
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
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

        // Use 'driving' for everything to avoid Mapbox distance limits for walking/cycling
        const profile = "driving";

        const dir = await directionsClient.getDirections({
          profile,
          geometries: "geojson",
          waypoints: [
            { coordinates: [lngFrom, latFrom] },
            { coordinates: [lngTo, latTo] },
          ],
        }).send();

        if (dir.body.routes.length > 0) {
          const route = dir.body.routes[0];
          setDistance((route.distance / 1000).toFixed(1));
          
          let durationMin = route.duration / 60;
          
          // Apply realistic multipliers relative to driving speed
          if (mode === "bus") {
            durationMin *= 1.5;    // Slower due to stops
          } else if (mode === "train") {
            durationMin *= 0.7;    // Faster, no traffic
          } else if (mode === "bike") {
            durationMin *= 3.5;   // ~15-20 km/h
          } else if (mode === "walk" || mode === "footprints") {
            durationMin *= 10.0;  // ~5 km/h
          } else {
            durationMin *= 1.0;   // car, cab
          }
          
          setDuration(Math.round(durationMin).toString());
        }
      } catch (err) {
        console.error("Auto-calculate failed:", err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchRoute();
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [from, to, mode]);

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

    try {
      await apiRequest("/api/trips", "POST", {
        from,
        to,
        mode,
        distance: Number(distance),
        duration: Number(duration),
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      });

      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message || "Failed to add trip");
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

return (
  <motion.div 
    style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}
    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, transition: { type: "spring", bounce: 0.5 } }}
  >
    <div style={{ maxWidth: "800px", width: "100%", padding: "40px", background: "#FFFFFF", borderRadius: "24px", border: "4px solid #14213D", boxShadow: "8px 8px 0px #14213D" }}>
      <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", fontSize: "2.5rem", color: "#14213D", marginBottom: "8px" }}>
        Add a New Trip
      </h1>
      <p style={{ textAlign: "center", fontSize: "1.1rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "32px" }}>
        Record your journey and let Tripchain calculate insights for you.
      </p>

      <form onSubmit={handleAddTrip} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <div style={{ display: "flex", gap: "20px", flexDirection: window.innerWidth < 600 ? "column" : "row" }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
            From
            <input 
              type="text" required value={from} onChange={(e) => setFrom(e.target.value)} 
              placeholder="e.g. Home"
              style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)" }}
              onFocus={(e) => { e.target.style.borderColor = "#3A86FF"; e.target.style.background = "#FFFFFF"; }}
              onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; }}
            />
          </label>

          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
            To
            <input 
              type="text" required value={to} onChange={(e) => setTo(e.target.value)} 
              placeholder="e.g. Office"
              style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)" }}
              onFocus={(e) => { e.target.style.borderColor = "#3A86FF"; e.target.style.background = "#FFFFFF"; }}
              onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; }}
            />
          </label>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>Mode of Travel</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "16px" }}>
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
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                  padding: "16px", borderRadius: "16px", border: "3px solid #14213D",
                  background: mode === m.id ? m.color : "#FFFFFF",
                  color: mode === m.id ? "#FFFFFF" : "#14213D",
                  boxShadow: mode === m.id ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D",
                  transition: "all 0.2s", cursor: "pointer", fontWeight: "bold"
                }}
              >
                <m.icon size={28} />
                <span style={{ fontSize: "14px" }}>{m.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", flexDirection: window.innerWidth < 600 ? "column" : "row" }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
            Distance (km)
            <input 
              type="number" required min="0" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} 
              style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)" }}
              onFocus={(e) => { e.target.style.borderColor = "#3A86FF"; e.target.style.background = "#FFFFFF"; }}
              onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; }}
            />
          </label>

          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
            Duration (min)
            <input 
              type="number" required min="0" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} 
              style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)" }}
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
            {date ? new Date(date).toLocaleString() : "Select Date & Time"}
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
          style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", padding: "18px", fontSize: "1.2rem", fontWeight: "bold", borderRadius: "16px", background: "#10B981", color: "#FFFFFF", border: "3px solid #14213D", boxShadow: "4px 4px 0px #14213D", marginTop: "16px" }}
        >
          <Check size={24} /> Save Trip
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
              padding: "24px",
              width: "90%",
              maxWidth: "400px",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={20} /> Pick Date & Time
              </h3>
              <button 
                type="button"
                onClick={() => setShowDateModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontWeight: "600" }}>Date</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#FFFFFF", border: "3px solid #14213D", padding: "10px", borderRadius: "12px" }}>
                <Calendar size={18} color="var(--primary)" />
                <select value={day} onChange={e => setDay(e.target.value)} style={{ appearance: "none", border: "none", outline: "none", background: "transparent", fontSize: "16px", fontWeight: "bold", paddingRight: "10px", cursor: "pointer" }}>
                  {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <span style={{color: "#cbd5e1"}}>/</span>
                <select value={month} onChange={e => setMonth(e.target.value)} style={{ appearance: "none", border: "none", outline: "none", background: "transparent", fontSize: "16px", fontWeight: "bold", paddingRight: "10px", cursor: "pointer" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#FFFFFF", border: "3px solid #14213D", padding: "10px", borderRadius: "12px" }}>
                <Clock size={18} color="var(--primary)" />
                <select value={hour} onChange={e => setHour(e.target.value)} style={{ appearance: "none", border: "none", outline: "none", background: "transparent", fontSize: "16px", fontWeight: "bold", paddingRight: "10px", cursor: "pointer" }}>
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

    <NotificationModal 
      isOpen={showSuccessModal} 
      onClose={() => {
        setShowSuccessModal(false);
        navigate("/");
      }} 
      message="Trip successfully recorded!" 
    />
  </motion.div>
);
};

export default AddTrip;
