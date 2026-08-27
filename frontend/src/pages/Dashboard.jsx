import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Activity, Leaf, Bell, Route, Navigation, MapPin } from "lucide-react";
import "../styles/dashboard.css"; 

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [ecoScore, setEcoScore] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [o, e, n, t] = await Promise.all([
          apiRequest("/api/dashboard/overview"),
          apiRequest("/api/eco-score"),
          apiRequest("/api/notifications"),
          apiRequest("/api/trips")
        ]);

        setOverview(o.overview || null);
        setEcoScore(e.ecoScore ?? o.overview?.ecoScore ?? 0);
        setNotifications(n.notifications || []);
        setRecentTrips(t.trips?.slice(0, 4) || []);

      } catch (err) {
        console.error("Dashboard error:", err.message);
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
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 20px 40px" }}>
      {/* HEADER */}
      <div className="page-header" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <LayoutDashboard size={36} color="var(--primary)" fill="var(--primary)" stroke="#14213D" strokeWidth={2} />
          Dashboard
        </h2>
        <p>Your travel analytics, eco performance & achievements at a glance ✨</p>
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        {/* TOP GRID CARDS */}
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          <motion.div className="stat-card glass-card hover-card" variants={itemVariants} onClick={() => navigate("/insights")} style={{ cursor: "pointer", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", margin: 0 }}><Navigation size={20} color="#3A86FF" /> Total Trips</h4>
            <p className="stat-value" style={{ fontSize: "36px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>{overview?.totalTrips ?? 0}</p>
          </motion.div>

          <motion.div className="stat-card glass-card hover-card" variants={itemVariants} onClick={() => navigate("/insights")} style={{ cursor: "pointer", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", margin: 0 }}><Activity size={20} color="#8b5cf6" /> Total Distance</h4>
            <p className="stat-value" style={{ fontSize: "36px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>{overview?.totalDistance ?? 0} <span style={{ fontSize: "20px" }}>km</span></p>
          </motion.div>

          <motion.div className="stat-card glass-card hover-card" variants={itemVariants} onClick={() => navigate("/achievements")} style={{ cursor: "pointer", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", margin: 0 }}><Leaf size={20} color="#10B981" /> Eco Score</h4>
            <p className="stat-value accent" style={{ fontSize: "36px", fontWeight: "800", color: "#10B981", margin: 0 }}>
              {ecoScore ?? overview?.ecoScore ?? 0}
            </p>
          </motion.div>
        </div>

        {/* RECENT TRIPS */}
        <motion.section className="section-card glass-card" variants={itemVariants} style={{ padding: "30px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", marginBottom: "20px" }}>
            <Route size={24} /> Recent Trips
          </h3>

          {recentTrips.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No trips yet. Start tracking your journey!</p>
          )}

          <div className="recent-trips" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="trip-card"
                onClick={() => navigate(`/insights?trip=${trip.id}`)}
                style={{
                  display: "flex", flexDirection: "column", gap: "8px", padding: "16px",
                  background: "rgba(255,255,255,0.5)", border: "2px solid rgba(20,33,61,0.1)",
                  borderRadius: "14px", cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "rgba(20,33,61,0.1)";
                }}
              >
                <div className="trip-header" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", color: "#3A86FF" }}>
                  <MapPin size={18} /> <strong>{trip.from}</strong> → <strong>{trip.to}</strong>
                </div>

                <p className="trip-meta" style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, paddingLeft: "26px" }}>
                  {trip.distance} km • {trip.duration} min • <span style={{ textTransform: "capitalize" }}>{trip.mode}</span>
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* NOTIFICATIONS */}
        <motion.section className="section-card glass-card" variants={itemVariants} style={{ padding: "30px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#F59E0B", marginBottom: "20px" }}>
            <Bell size={24} /> Notifications & Tips
          </h3>

          {notifications.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No notifications yet. Keep traveling!</p>
          )}

          <ul className="notifications-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            {notifications.map((n, idx) => (
              <li key={idx} className={`notif-pill notif-${n.type || "info"}`} style={{
                padding: "12px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "600",
                background: n.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(58, 134, 255, 0.1)",
                color: n.type === "success" ? "#10B981" : "#3A86FF",
                border: `2px solid ${n.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(58, 134, 255, 0.2)"}`
              }}>
                {n.message}
              </li>
            ))}
          </ul>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Dashboard;
