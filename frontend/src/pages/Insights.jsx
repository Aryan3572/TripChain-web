import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { motion } from "framer-motion";
import { BarChart3, PieChart, Zap, Map, Lightbulb } from "lucide-react";

const Insights = () => {
  const [weekly, setWeekly] = useState([]);
  const [modes, setModes] = useState({});
  const [impact, setImpact] = useState(null);
  const [patterns, setPatterns] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [w, m, i, p] = await Promise.all([
          apiRequest("/api/trip-insights/weekly"),
          apiRequest("/api/trip-insights/modes"),
          apiRequest("/api/trip-insights/impact"),
          apiRequest("/api/trips/patterns")
        ]);

        setWeekly(w.weeks || []);
        setModes(m.modeStats || m.modeBreakdown || {});
        setImpact(i.insights || i);
        setPatterns(p.patterns || []);
      } catch (err) {
        console.error("Insights error:", err.message);
      }
    })();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.5 } }
  };

  return (
    <motion.div 
      style={{ display: "flex", flexDirection: "column", gap: "40px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px", paddingTop: "40px" }}
      initial="hidden" animate="visible" variants={containerVariants}
    >
      <motion.div variants={itemVariants} style={{ textAlign: "center" }}>
        <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", fontSize: "3rem", color: "#14213D", marginBottom: "8px" }}>
          <Lightbulb size={48} color="#FF006E" /> Trip Insights
        </h1>
        <p style={{ fontSize: "1.2rem", color: "var(--text-muted)", fontWeight: "600" }}>Your recent travel behaviour, patterns & efficiency ✨</p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "32px" }}>
        
        {/* WEEKLY SUMMARY */}
        <motion.div 
          style={{ padding: "32px", background: "#FFFFFF", borderRadius: "24px", border: "4px solid #14213D", boxShadow: "8px 8px 0px #14213D", display: "flex", flexDirection: "column", gap: "16px" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", color: "#14213D", fontSize: "1.6rem", borderBottom: "3px solid #14213D", paddingBottom: "12px" }}>
            <BarChart3 size={32} color="#3A86FF" /> Weekly Summary
          </h3>
          {weekly.length === 0 && <p style={{color: "var(--text-muted)", fontWeight: "600"}}>No trips recorded yet.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {weekly.map((w) => (
              <div key={w.week} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "3px solid #14213D" }}>
                <strong style={{ fontSize: "1.1rem", color: "#14213D" }}>{w.week}</strong>
                <div style={{ textAlign: "right", fontSize: "1rem", fontWeight: "600", color: "#64748b" }}>
                  {w.totalDistance.toFixed(1)} km, {w.totalDuration} min
                  <div style={{color: "#EF4444"}}>CO₂ {w.totalCO2.toFixed(1)}g</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* MODE SHARE */}
        <motion.div 
          style={{ padding: "32px", background: "#FFFFFF", borderRadius: "24px", border: "4px solid #14213D", boxShadow: "8px 8px 0px #14213D", display: "flex", flexDirection: "column", gap: "16px" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", color: "#14213D", fontSize: "1.6rem", borderBottom: "3px solid #14213D", paddingBottom: "12px" }}>
            <PieChart size={32} color="#8338EC" /> Mode Breakdown
          </h3>
          {Object.keys(modes).length === 0 && (
            <p style={{color: "var(--text-muted)", fontWeight: "600"}}>No mode data available.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {Object.entries(modes).map(([mode, data]) => (
              <div key={mode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "3px solid #14213D" }}>
                <strong style={{ textTransform: "capitalize", fontSize: "1.2rem", color: "#14213D" }}>{mode}</strong>
                <div style={{ fontWeight: "800", fontSize: "1.2rem", color: "#8338EC" }}>
                  {data.count || data} trips {data.percentage && <span style={{ color: "var(--text-muted)", fontSize: "0.9em" }}>({data.percentage}%)</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* IMPACT */}
        <motion.div 
          style={{ padding: "32px", background: "#FFFFFF", borderRadius: "24px", border: "4px solid #14213D", boxShadow: "8px 8px 0px #14213D", display: "flex", flexDirection: "column", gap: "16px" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", color: "#14213D", fontSize: "1.6rem", borderBottom: "3px solid #14213D", paddingBottom: "12px" }}>
            <Zap size={32} color="#10B981" /> Impact
          </h3>
          {!impact && <p style={{color: "var(--text-muted)", fontWeight: "600"}}>No impact data yet.</p>}
          {impact && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FEF2F2", padding: "16px", borderRadius: "16px", border: "3px solid #EF4444" }}>
                <strong style={{ fontSize: "1.1rem", color: "#14213D" }}>Total CO₂</strong> 
                <strong style={{color: "#EF4444", fontSize: "1.3rem"}}>{impact.totalCO2.toFixed(2)} g</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#D1FAE5", padding: "16px", borderRadius: "16px", border: "3px solid #10B981" }}>
                <strong style={{ fontSize: "1.1rem", color: "#14213D" }}>Total Cost</strong> 
                <strong style={{color: "#10B981", fontSize: "1.3rem"}}>₹{impact.totalCost.toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "3px solid #14213D" }}>
                <strong style={{ fontSize: "1.1rem", color: "#14213D" }}>Avg CO₂/km</strong> 
                <strong style={{color: "#3A86FF", fontSize: "1.3rem"}}>{impact.avgCO2perKm.toFixed(3)} g</strong>
              </div>
            </div>
          )}
        </motion.div>

        {/* ROUTE PATTERNS */}
        <motion.div 
          style={{ padding: "32px", background: "#FFFFFF", borderRadius: "24px", border: "4px solid #14213D", boxShadow: "8px 8px 0px #14213D", display: "flex", flexDirection: "column", gap: "16px" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", color: "#14213D", fontSize: "1.6rem", borderBottom: "3px solid #14213D", paddingBottom: "12px" }}>
            <Map size={32} color="#FFBE0B" /> Frequent Routes
          </h3>
          {patterns.length === 0 && (
            <p style={{color: "var(--text-muted)", fontWeight: "600"}}>No frequent routes yet.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {patterns.map((p, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#FFFBEB", padding: "16px", borderRadius: "16px", border: "3px solid #F59E0B" }}>
                <strong style={{ fontSize: "1.2rem", color: "#14213D" }}>{p.from} → {p.to}</strong>
                <span style={{ fontSize: "1rem", color: "#B45309", fontWeight: "700" }}>{p.count} trips, avg {p.avgDistance} km, {p.avgDuration} min</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

export default Insights;
