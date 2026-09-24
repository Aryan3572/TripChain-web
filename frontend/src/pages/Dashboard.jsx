import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Activity, Leaf, Bell, Route, Navigation, Zap, 
  Award, Lightbulb, Plus, ArrowRight, Clock, Sparkles, 
  Footprints, Bike, Bus, Car, Train, Compass, Target, ChevronRight,
  Coins
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import "../styles/dashboard.css"; 

// Mode styling helper
const getModeConfig = (mode) => {
  const m = (mode || "").toLowerCase();
  if (m === "walk" || m === "walking" || m === "footprints") {
    return { Icon: Footprints, label: "Walk", bg: "#DCFCE7", color: "#15803D", border: "#16A34A" };
  }
  if (m === "bike" || m === "cycling" || m === "bicycle") {
    return { Icon: Bike, label: "Bicycle", bg: "#D1FAE5", color: "#047857", border: "#10B981" };
  }
  if (m === "bus" || m === "transit") {
    return { Icon: Bus, label: "Bus", bg: "#F3E8FF", color: "#6B21A8", border: "#A855F7" };
  }
  if (m === "train" || m === "rail" || m === "metro") {
    return { Icon: Train, label: "Train", bg: "#E0E7FF", color: "#3730A3", border: "#6366F1" };
  }
  if (m === "cab" || m === "taxi") {
    return { Icon: Car, label: "Taxi", bg: "#FEF3C7", color: "#B45309", border: "#F59E0B" };
  }
  return { Icon: Car, label: mode || "Car", bg: "#DBEAFE", color: "#1E40AF", border: "#3B82F6" };
};

// Notification categorization helper
const getNotifConfig = (type) => {
  switch (type) {
    case "achievement":
      return {
        badge: " ACHIEVEMENT UNLOCKED",
        Icon: Award,
        bg: "#FFFBEB",
        accent: "#D97706",
        border: "#F59E0B",
        tagBg: "#FEF3C7",
        btnText: "View Badges",
        link: "/achievements"
      };
    case "success":
      return {
        badge: " ECO MILESTONE",
        Icon: Leaf,
        bg: "#F0FDF4",
        accent: "#059669",
        border: "#10B981",
        tagBg: "#D1FAE5",
        btnText: "Explore Eco Routes",
        link: "/planner"
      };
    case "tip":
      return {
        badge: "SMART TRAVEL HACK",
        Icon: Lightbulb,
        bg: "#FEFCE8",
        accent: "#CA8A04",
        border: "#EAB308",
        tagBg: "#FEF08A",
        btnText: "Open Planner",
        link: "/planner"
      };
    case "goal":
      return {
        badge: "WEEKLY EXPEDITION QUEST",
        Icon: Target,
        bg: "#EEF2FF",
        accent: "#4338CA",
        border: "#6366F1",
        tagBg: "#E0E7FF",
        btnText: "Check Insights",
        link: "/insights"
      };
    case "summary":
      return {
        badge: "EXPEDITION RECAP",
        Icon: Activity,
        bg: "#EFF6FF",
        accent: "#1D4ED8",
        border: "#3B82F6",
        tagBg: "#DBEAFE",
        btnText: "View Analytics",
        link: "/insights"
      };
    default:
      return {
        badge: "TRAVEL RADAR ADVISORY",
        Icon: Compass,
        bg: "#F8FAFC",
        accent: "#1E40AF",
        border: "#3A86FF",
        tagBg: "#E2E8F0",
        btnText: "Open Planner",
        link: "/planner"
      };
  }
};

// Fallback curated tips when user has zero trips or empty notifications
const DEFAULT_RADAR_INSIGHTS = [
  {
    type: "goal",
    message: "Log your first commute today to claim your Welcome Pioneer status and score +50 bonus points!"
  },
  {
    type: "tip",
    message: "Swapping short car trips under 3 km for walking or cycling eliminates up to 450g of CO₂ per trip."
  },
  {
    type: "success",
    message: "Multi-modal routing: combining metro and electric transit in our Route Planner saves up to 60% carbon footprint."
  }
];

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [ecoScore, setEcoScore] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const { tripBalance, rewardStats, claimRewards, txPending } = useWeb3();

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
        
        // Filter out generic single-line default notifications if we have richer insights
        const rawNotifs = n.notifications || [];
        const isGenericEmptyNotif = rawNotifs.length === 1 && rawNotifs[0].message?.toLowerCase().includes("no trips logged");
        setNotifications(isGenericEmptyNotif || rawNotifs.length === 0 ? DEFAULT_RADAR_INSIGHTS : rawNotifs);

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
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 22 } }
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

        {/* WEB3 ECO-REWARDS HERO CARD */}
        <motion.div
          variants={itemVariants}
          style={{
            background: "linear-gradient(135deg, #14213D 0%, #1E293B 100%)",
            border: "4px solid #14213D",
            borderRadius: "24px",
            padding: "clamp(20px, 4vw, 32px)",
            boxShadow: "6px 6px 0px #FFBE0B",
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "560px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FFBE0B", fontWeight: "800", fontSize: "0.9rem", textTransform: "uppercase" }}>
              <Coins size={18} /> Web3 Tokenized Mobility
            </div>
            <h3 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: "900", margin: 0, color: "#FFFFFF" }}>
              $TRIP Eco-Rewards & Carbon Neutrality
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "0.95rem", margin: 0, fontWeight: "500" }}>
              Turn your green commutes into on-chain tokens. Claim reward vouchers or burn tokens to permanently neutralize CO₂ emissions.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "8px", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#94A3B8", display: "block" }}>Wallet Balance</span>
                <span style={{ fontSize: "1.3rem", fontWeight: "900", color: "#FFBE0B" }}>{tripBalance} $TRIP</span>
              </div>
              <div style={{ width: "2px", height: "30px", background: "#334155" }}></div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#94A3B8", display: "block" }}>Unclaimed Rewards</span>
                <span style={{ fontSize: "1.3rem", fontWeight: "900", color: "#10B981" }}>
                  {rewardStats?.pendingClaimableTrip || 0} $TRIP
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "260px" }}>
            {rewardStats?.pendingClaimableTrip > 0 ? (
              <button
                onClick={claimRewards}
                disabled={txPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 20px",
                  borderRadius: "14px",
                  background: "#22C55E",
                  color: "#FFFFFF",
                  border: "2px solid #16A34A",
                  fontWeight: "900",
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "3px 3px 0px #166534",
                }}
              >
                <Sparkles size={18} /> {txPending ? "Confirming..." : `Claim ${rewardStats.pendingClaimableTrip} $TRIP`}
              </button>
            ) : null}

            <button
              onClick={() => navigate("/rewards")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px 20px",
                borderRadius: "14px",
                background: "#FFBE0B",
                color: "#14213D",
                border: "2px solid #14213D",
                fontWeight: "900",
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "3px 3px 0px #14213D",
              }}
            >
              Explore Web3 Hub <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>

        {/* RECENT TRIPS */}
        <motion.section className="section-card" variants={itemVariants}>
          <div className="section-header-flex">
            <div>
              <div className="section-kicker">
                <Compass size={14} /> TRAVEL LOG
              </div>
              <h3 className="section-title">
                <Route size={26} color="#3A86FF" /> Recent Expeditions
              </h3>
            </div>

            <div className="section-actions">
              {recentTrips.length > 0 && (
                <span className="count-pill">
                  {recentTrips.length} {recentTrips.length === 1 ? "Trip" : "Trips"} Logged
                </span>
              )}
              <button 
                className="neo-btn-sm" 
                onClick={() => navigate("/track")}
                style={{ background: "#00F5D4", color: "#14213D", border: "2px solid #14213D", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Compass size={16} strokeWidth={2.5} /> Live Commute
              </button>
              <button 
                className="neo-btn-sm" 
                onClick={() => navigate("/add-trip")}
              >
                <Plus size={16} strokeWidth={3} /> Log Trip
              </button>
            </div>
          </div>

          {recentTrips.length === 0 ? (
            /* Catchy Gamified Empty State */
            <div className="empty-expedition-card">
              <div className="empty-art-orbit">
                <div className="orbit-center-icon">
                  <Compass size={38} color="#3A86FF" strokeWidth={2.5} />
                </div>
                <div className="floating-badge badge-top-right">
                  <Leaf size={13} color="#059669" /> Eco Mode
                </div>
                <div className="floating-badge badge-bottom-left">
                  <Sparkles size={13} color="#D97706" /> Earn XP
                </div>
              </div>

              <h4>Your Expedition Log is Ready</h4>
              <p>
                Every journey counts! Track your daily commute in real time, save CO₂, and level up your eco adventurer rank across the globe.
              </p>

              <div className="empty-cta-group">
                <button className="neo-cta-primary" onClick={() => navigate("/track")} style={{ background: "#00F5D4", color: "#14213D" }}>
                  <Compass size={18} /> Start Live Commute
                </button>
                <button className="neo-cta-secondary" onClick={() => navigate("/planner")}>
                  <Route size={18} /> Plan an Eco Route
                </button>
              </div>
            </div>
          ) : (
            /* Catchy Boarding Pass / Ticket Cards */
            <div className="recent-trips-grid">
              {recentTrips.map((trip) => {
                const isEco = trip.routeType === "eco";
                const modeCfg = getModeConfig(trip.mode);
                const ModeIcon = modeCfg.Icon;

                return (
                  <div
                    key={trip.id}
                    className={`trip-ticket-card ${isEco ? "is-eco" : ""}`}
                    onClick={() => navigate(`/insights?trip=${trip.id}`)}
                  >
                    <div className="trip-ticket-left">
                      <div 
                        className="trip-mode-squircle" 
                        style={{ 
                          background: modeCfg.bg, 
                          border: `2.5px solid ${modeCfg.border}` 
                        }}
                      >
                        <ModeIcon size={24} color={modeCfg.color} strokeWidth={2.2} />
                      </div>

                      <div className="trip-route-info">
                        <div className="trip-route-path">
                          <span className="trip-path-point" title={trip.from}>
                            {trip.from}
                          </span>
                          <span className="trip-path-arrow">
                            <ArrowRight size={18} strokeWidth={2.5} />
                          </span>
                          <span className="trip-path-point" title={trip.to}>
                            {trip.to}
                          </span>
                        </div>

                        <div className="trip-chips-row">
                          {isEco ? (
                            <span className="trip-stat-chip eco-pill">
                              <Leaf size={12} color="#059669" /> Eco Route
                            </span>
                          ) : (
                            <span className="trip-stat-chip route-type-pill">
                              <Zap size={12} color="#2563EB" /> Fastest
                            </span>
                          )}

                          <span className="trip-stat-chip">
                            <Navigation size={12} /> {trip.distance} km
                          </span>

                          <span className="trip-stat-chip">
                            <Clock size={12} /> {trip.duration} min
                          </span>

                          {trip.co2Saved > 0 && (
                            <span className="trip-stat-chip eco-pill">
                              🌱 -{trip.co2Saved} kg CO₂
                            </span>
                          )}

                          {trip.points && (
                            <span className="trip-stat-chip points-pill">
                              <Sparkles size={12} /> +{trip.points} pts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="trip-ticket-right">
                      <div className="view-details-arrow" title="View Insights">
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* NOTIFICATIONS & TIPS */}
        <motion.section className="section-card" variants={itemVariants}>
          <div className="section-header-flex">
            <div>
              <div className="section-kicker">
                <Zap size={14} /> LIVE INTELLIGENCE FEED
              </div>
              <h3 className="section-title">
                <Bell size={26} color="#F59E0B" /> Travel Radar & Smart Insights
              </h3>
            </div>

            <div className="section-actions">
              <div className="radar-live-indicator">
                <span className="radar-beacon-dot"></span>
                ACTIVE RADAR
              </div>
            </div>
          </div>

          <div className="radar-cards-grid">
            {notifications.map((n, idx) => {
              const cfg = getNotifConfig(n.type);
              const NotifIcon = cfg.Icon;

              return (
                <div 
                  key={idx} 
                  className="radar-smart-card"
                  style={{ 
                    background: cfg.bg, 
                    borderColor: "#14213D" 
                  }}
                  onClick={() => navigate(cfg.link)}
                >
                  <div className="radar-card-header">
                    <span 
                      className="radar-category-tag"
                      style={{ 
                        background: cfg.tagBg, 
                        color: cfg.accent,
                        borderColor: "#14213D"
                      }}
                    >
                      <NotifIcon size={14} color={cfg.accent} strokeWidth={2.5} />
                      {cfg.badge}
                    </span>
                  </div>

                  <div className="radar-card-body">
                    {n.message}
                  </div>

                  <div className="radar-card-footer">
                    <span className="radar-action-link">
                      {cfg.btnText} <ArrowRight size={14} strokeWidth={2.5} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Dashboard;
