import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Activity, Leaf, Bell, Route, Navigation, MapPin, Zap, Award, Globe, Lightbulb, Info } from "lucide-react";
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
    <div className="page-wrapper" style={{ maxWidth: "1200px", margin: "0 auto", padding: "clamp(10px, 2.5vw, 24px) clamp(10px, 2.5vw, 20px) 40px", boxSizing: "border-box", width: "100%" }}>
      {/* HEADER */}
      <div className="page-header" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "clamp(20px, 4vw, 40px)", textAlign: "center" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "clamp(2rem, 5vw, 3rem)", justifyContent: "center" }}>
          <LayoutDashboard size={36} color="var(--primary)" fill="var(--primary)" stroke="#14213D" strokeWidth={2} />
          Dashboard
        </h2>
        <p style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)" }}>Your travel analytics, eco performance & achievements at a glance</p>
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}
      >
        {/* TOP GRID CARDS */}
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "20px", width: "100%", boxSizing: "border-box" }}>
          <motion.div className="stat-card glass-card hover-card" variants={itemVariants} onClick={() => navigate("/insights")} style={{ cursor: "pointer", padding: "clamp(18px, 3vw, 24px)", display: "flex", flexDirection: "column", gap: "12px", boxSizing: "border-box" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", margin: 0, fontSize: "clamp(0.9rem, 2vw, 1.05rem)" }}><Navigation size={20} color="#3A86FF" /> Total Trips</h4>
            <p className="stat-value" style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>{overview?.totalTrips ?? 0}</p>
          </motion.div>

          <motion.div className="stat-card glass-card hover-card" variants={itemVariants} onClick={() => navigate("/insights")} style={{ cursor: "pointer", padding: "clamp(18px, 3vw, 24px)", display: "flex", flexDirection: "column", gap: "12px", boxSizing: "border-box" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", margin: 0, fontSize: "clamp(0.9rem, 2vw, 1.05rem)" }}><Activity size={20} color="#8b5cf6" /> Total Distance</h4>
            <p className="stat-value" style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>{overview?.totalDistance ?? 0} <span style={{ fontSize: "20px" }}>km</span></p>
          </motion.div>

          <motion.div className="stat-card glass-card hover-card" variants={itemVariants} onClick={() => navigate("/achievements")} style={{ cursor: "pointer", padding: "clamp(18px, 3vw, 24px)", display: "flex", flexDirection: "column", gap: "12px", boxSizing: "border-box" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", margin: 0, fontSize: "clamp(0.9rem, 2vw, 1.05rem)" }}><Leaf size={20} color="#10B981" /> Eco Score</h4>
            <p className="stat-value accent" style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: "800", color: "#10B981", margin: 0 }}>
              {ecoScore ?? overview?.ecoScore ?? 0}
            </p>
          </motion.div>

          <motion.div className="stat-card glass-card hover-card" variants={itemVariants} onClick={() => navigate("/planner")} style={{ cursor: "pointer", padding: "clamp(18px, 3vw, 24px)", display: "flex", flexDirection: "column", gap: "12px", background: "linear-gradient(135deg, rgba(209, 250, 229, 0.6) 0%, rgba(255, 255, 255, 0.8) 100%)", border: "3px solid #10B981", boxSizing: "border-box" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#047857", margin: 0, fontSize: "clamp(0.9rem, 2vw, 1.05rem)" }}><Leaf size={20} color="#059669" /> Eco Routes</h4>
            <p className="stat-value" style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: "800", color: "#065F46", margin: 0 }}>
              {overview?.ecoRoutesCount ?? 0}
              <span style={{ fontSize: "clamp(13px, 2vw, 16px)", fontWeight: "700", color: "#059669", marginLeft: "8px" }}>
                ({overview?.totalCO2Saved ?? 0} kg CO₂ saved)
              </span>
            </p>
          </motion.div>
        </div>

        {/* RECENT TRIPS */}
        <motion.section className="section-card glass-card" variants={itemVariants} style={{ padding: "clamp(18px, 4vw, 30px)", width: "100%", boxSizing: "border-box" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", marginBottom: "20px", fontSize: "clamp(1.3rem, 3vw, 1.8rem)" }}>
            <Route size={24} /> Recent Trips
          </h3>

          {recentTrips.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No trips yet. Start tracking your journey!</p>
          )}

          <div className="recent-trips" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {recentTrips.map((trip) => {
              const isEco = trip.routeType === "eco";
              return (
                <div
                  key={trip.id}
                  className="trip-card"
                  onClick={() => navigate(`/insights?trip=${trip.id}`)}
                  style={{
                    display: "flex", flexDirection: "column", gap: "8px", padding: "16px",
                    background: isEco ? "rgba(209, 250, 229, 0.35)" : "rgba(255,255,255,0.5)", 
                    border: isEco ? "2px solid rgba(16, 185, 129, 0.4)" : "2px solid rgba(20,33,61,0.1)",
                    borderRadius: "14px", cursor: "pointer", transition: "all 0.2s",
                    boxSizing: "border-box", width: "100%"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = isEco ? "#10B981" : "var(--primary)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = isEco ? "rgba(16, 185, 129, 0.4)" : "rgba(20,33,61,0.1)";
                  }}
                >
                  <div className="trip-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "16px", color: "#3A86FF", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MapPin size={18} /> <strong>{trip.from}</strong> → <strong>{trip.to}</strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isEco ? (
                        <span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", border: "1.5px solid #10B981", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Leaf size={13} color="#059669" /> Eco Route
                        </span>
                      ) : (
                        <span style={{ background: "#DBEAFE", color: "#1E40AF", padding: "3px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", border: "1.5px solid #3B82F6", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Zap size={13} color="#2563EB" /> Fastest
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="trip-meta" style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, paddingLeft: "clamp(2px, 2vw, 26px)", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>{trip.distance} km • {trip.duration} min • <span style={{ textTransform: "capitalize" }}>{trip.mode}</span></span>
                    {trip.co2Saved > 0 && (
                      <span style={{ color: "#059669", fontWeight: "700" }}>
                        • Saved ~{trip.co2Saved} kg CO₂
                      </span>
                    )}
                    {trip.points && (
                      <span style={{ color: "#D97706", fontWeight: "700" }}>
                        • +{trip.points} pts
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* NOTIFICATIONS */}
        <motion.section className="section-card glass-card" variants={itemVariants} style={{ padding: "clamp(18px, 4vw, 30px)", width: "100%", boxSizing: "border-box" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#F59E0B", marginBottom: "20px" }}>
            <Bell size={24} /> Notifications & Tips
          </h3>

          {notifications.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No notifications yet. Keep traveling!</p>
          )}

          <ul className="notifications-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            {notifications.map((n, idx) => {
              let NotifIcon = Info;
              let iconColor = "#3A86FF";
              if (n.type === "success") {
                NotifIcon = Leaf;
                iconColor = "#10B981";
              } else if (n.type === "achievement") {
                NotifIcon = Award;
                iconColor = "#F59E0B";
              } else if (n.type === "goal") {
                NotifIcon = Globe;
                iconColor = "#6366F1";
              } else if (n.type === "tip") {
                NotifIcon = Lightbulb;
                iconColor = "#F59E0B";
              } else if (n.type === "summary") {
                NotifIcon = Activity;
                iconColor = "#3A86FF";
              }

              return (
                <li key={idx} className={`notif-pill notif-${n.type || "info"}`} style={{
                  padding: "12px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "600",
                  background: n.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(58, 134, 255, 0.1)",
                  color: n.type === "success" ? "#065F46" : "#1E40AF",
                  border: `2px solid ${n.type === "success" ? "rgba(16, 185, 129, 0.25)" : "rgba(58, 134, 255, 0.25)"}`,
                  display: "flex", alignItems: "center", gap: "10px"
                }}>
                  <NotifIcon size={18} color={iconColor} style={{ flexShrink: 0 }} />
                  <span>{n.message}</span>
                </li>
              );
            })}
          </ul>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Dashboard;
