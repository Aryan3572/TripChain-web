import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { motion } from "framer-motion";
import { BarChart3, PieChart, Zap, Map, Lightbulb, Leaf } from "lucide-react";

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
      style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 4vw, 40px)", maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px", paddingTop: "20px", width: "100%", boxSizing: "border-box" }}
      initial="hidden" animate="visible" variants={containerVariants}
    >
      <motion.div variants={itemVariants} style={{ textAlign: "center" }}>
        <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", fontSize: "clamp(2rem, 5vw, 3rem)", color: "#14213D", marginBottom: "8px", flexWrap: "wrap" }}>
          <Lightbulb size={40} color="#FF006E" /> Trip Insights
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", color: "var(--text-muted)", fontWeight: "600" }}>Your recent travel behaviour, patterns & efficiency</p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "clamp(16px, 3vw, 32px)", width: "100%", boxSizing: "border-box" }}>
        
        {/* WEEKLY SUMMARY */}
        <motion.div 
          style={{ padding: "clamp(18px, 4vw, 32px)", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "4px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", color: "#14213D", fontSize: "clamp(1.3rem, 3vw, 1.6rem)", borderBottom: "3px solid #14213D", paddingBottom: "12px" }}>
            <BarChart3 size={30} color="#3A86FF" /> Weekly Summary
          </h3>
          {weekly.length === 0 && <p style={{color: "var(--text-muted)", fontWeight: "600"}}>No trips recorded yet.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {weekly.map((w) => (
              <div key={w.week} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "14px 16px", borderRadius: "16px", border: "3px solid #14213D", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "1.1rem", color: "#14213D" }}>{w.week}</strong>
                <div style={{ textAlign: "right", fontSize: "0.95rem", fontWeight: "600", color: "#64748b" }}>
                  {w.totalDistance.toFixed(1)} km, {w.totalDuration} min
                  <div style={{color: "#EF4444"}}>CO₂ {w.totalCO2.toFixed(1)}g</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* MODE SHARE */}
        <motion.div 
          style={{ padding: "clamp(18px, 4vw, 32px)", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "4px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", color: "#14213D", fontSize: "clamp(1.3rem, 3vw, 1.6rem)", borderBottom: "3px solid #14213D", paddingBottom: "12px" }}>
            <PieChart size={30} color="#8338EC" /> Mode Breakdown
          </h3>
          {Object.keys(modes).length === 0 && (
            <p style={{color: "var(--text-muted)", fontWeight: "600"}}>No mode data available.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {Object.entries(modes).map(([mode, data]) => (
              <div key={mode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "14px 16px", borderRadius: "16px", border: "3px solid #14213D", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ textTransform: "capitalize", fontSize: "1.1rem", color: "#14213D" }}>{mode}</strong>
                <div style={{ fontWeight: "800", fontSize: "1.1rem", color: "#8338EC" }}>
                  {data.count || data} trips {data.percentage && <span style={{ color: "var(--text-muted)", fontSize: "0.9em" }}>({data.percentage}%)</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* IMPACT */}
        <motion.div 
          style={{ padding: "clamp(18px, 4vw, 32px)", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "4px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", color: "#14213D", fontSize: "clamp(1.3rem, 3vw, 1.6rem)", borderBottom: "3px solid #14213D", paddingBottom: "12px" }}>
            <Zap size={30} color="#10B981" /> Impact
          </h3>
          {!impact && <p style={{color: "var(--text-muted)", fontWeight: "600"}}>No impact data yet.</p>}
          {impact && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FEF2F2", padding: "14px 16px", borderRadius: "16px", border: "3px solid #EF4444", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "1.05rem", color: "#14213D" }}>Total CO₂</strong> 
                <strong style={{color: "#EF4444", fontSize: "1.2rem"}}>{impact.totalCO2.toFixed(2)} g</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#D1FAE5", padding: "14px 16px", borderRadius: "16px", border: "3px solid #10B981", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "1.05rem", color: "#14213D" }}>Total Cost</strong> 
                <strong style={{color: "#10B981", fontSize: "1.2rem"}}>₹{impact.totalCost.toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "14px 16px", borderRadius: "16px", border: "3px solid #14213D", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "1.05rem", color: "#14213D" }}>Avg CO₂/km</strong> 
                <strong style={{color: "#3A86FF", fontSize: "1.2rem"}}>{impact.avgCO2perKm.toFixed(3)} g</strong>
              </div>
              {impact.totalCO2Saved > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F0FDF4", padding: "14px 16px", borderRadius: "16px", border: "3px solid #16A34A", flexWrap: "wrap", gap: "8px" }}>
                  <strong style={{ fontSize: "1.05rem", color: "#065F46" }}>CO₂ Saved</strong> 
                  <strong style={{color: "#16A34A", fontSize: "1.2rem"}}>~{impact.totalCO2Saved} kg</strong>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ROUTE STRATEGY (ECO VS FASTEST) */}
        <motion.div 
          style={{ padding: "clamp(18px, 4vw, 32px)", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "4px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", color: "#14213D", fontSize: "clamp(1.3rem, 3vw, 1.6rem)", borderBottom: "3px solid #14213D", paddingBottom: "12px" }}>
            <Leaf size={30} color="#10B981" /> Route Choices
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#D1FAE5", padding: "14px 16px", borderRadius: "16px", border: "3px solid #10B981", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Leaf size={20} color="#059669" />
                <strong style={{ fontSize: "1.05rem", color: "#065F46" }}>Eco Routes</strong>
              </div>
              <strong style={{ color: "#047857", fontSize: "1.2rem" }}>{impact?.ecoRoutesCount ?? 0} trips</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#EFF6FF", padding: "14px 16px", borderRadius: "16px", border: "3px solid #3B82F6", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={20} color="#2563EB" />
                <strong style={{ fontSize: "1.05rem", color: "#1E40AF" }}>Fastest Routes</strong>
              </div>
              <strong style={{ color: "#1D4ED8", fontSize: "1.2rem" }}>{impact?.fastestRoutesCount ?? 0} trips</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FEF3C7", padding: "14px 16px", borderRadius: "16px", border: "3px solid #D97706", flexWrap: "wrap", gap: "8px" }}>
              <strong style={{ fontSize: "1.05rem", color: "#92400E" }}>Carbon Prevented</strong>
              <strong style={{ color: "#B45309", fontSize: "1.2rem" }}>~{impact?.totalCO2Saved ?? 0} kg CO₂</strong>
            </div>
          </div>
        </motion.div>

        {/* ROUTE PATTERNS */}
        <motion.div 
          style={{ padding: "clamp(18px, 4vw, 32px)", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "4px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", color: "#14213D", fontSize: "clamp(1.3rem, 3vw, 1.6rem)", borderBottom: "3px solid #14213D", paddingBottom: "12px" }}>
            <Map size={30} color="#FFBE0B" /> Frequent Routes
          </h3>
          {patterns.length === 0 && (
            <p style={{color: "var(--text-muted)", fontWeight: "600"}}>No frequent routes yet.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {patterns.map((p, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#FFFBEB", padding: "14px 16px", borderRadius: "16px", border: "3px solid #F59E0B", boxSizing: "border-box" }}>
                <strong style={{ fontSize: "1.1rem", color: "#14213D" }}>{p.from} → {p.to}</strong>
                <span style={{ fontSize: "0.95rem", color: "#B45309", fontWeight: "700" }}>{p.count} trips, avg {p.avgDistance} km, {p.avgDuration} min</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

export default Insights;
