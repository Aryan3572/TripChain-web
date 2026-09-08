import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Activity, Medal, Star, Leaf, Zap, Flame, Crown, Globe, Rocket, ShieldCheck, Award } from "lucide-react";

const BadgeIcon = ({ name }) => {
  const n = (name || "").toLowerCase();
  let Icon = Award;
  let bg = "#FFE4E6";
  let color = "#E11D48";
  let border = "#BE123C";

  if (n.includes('eco') || n.includes('green') || n.includes('leaf') || n.includes('tree')) {
    Icon = Leaf; bg = "#D1FAE5"; color = "#059669"; border = "#047857";
  } else if (n.includes('fast') || n.includes('speed') || n.includes('zap') || n.includes('quick')) {
    Icon = Zap; bg = "#DBEAFE"; color = "#2563EB"; border = "#1D4ED8";
  } else if (n.includes('streak') || n.includes('fire') || n.includes('hot')) {
    Icon = Flame; bg = "#FFEDD5"; color = "#EA580C"; border = "#C2410C";
  } else if (n.includes('champion') || n.includes('crown') || n.includes('gold') || n.includes('master')) {
    Icon = Crown; bg = "#FEF3C7"; color = "#D97706"; border = "#B45309";
  } else if (n.includes('global') || n.includes('world') || n.includes('globe') || n.includes('earth')) {
    Icon = Globe; bg = "#E0E7FF"; color = "#4F46E5"; border = "#4338CA";
  } else if (n.includes('rocket') || n.includes('stellar') || n.includes('space') || n.includes('pro')) {
    Icon = Rocket; bg = "#F3E8FF"; color = "#7E22CE"; border = "#6B21A8";
  } else if (n.includes('first') || n.includes('starter') || n.includes('beginner') || n.includes('novice')) {
    Icon = ShieldCheck; bg = "#DCFCE7"; color = "#16A34A"; border = "#15803D";
  } else {
    // Default fallback styling
    Icon = Award; bg = "#FCE7F3"; color = "#BE185D"; border = "#9D174D";
  }

  return (
    <div style={{
      width: "80px",
      height: "80px",
      borderRadius: "24px",
      background: bg,
      border: `4px solid ${border}`,
      boxShadow: `4px 4px 0px ${border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: "rotate(-5deg)",
      marginBottom: "12px"
    }}>
      <Icon size={44} color={color} strokeWidth={2.5} />
    </div>
  );
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [ecoScore, setEcoScore] = useState(null);
  const [badges, setBadges] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Fetch all data concurrently
        const [u, e, b] = await Promise.all([
          apiRequest("/api/auth/me"),
          apiRequest("/api/eco-score"),
          apiRequest("/api/achievements")
        ]);

        setUser(u.user || null);
        setEcoScore(e.ecoScore ?? null);
        setBadges(b.badges || b.earnedBadges || []);
      } catch (err) {
        console.error("Profile error:", err.message);
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
    visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.5 } }
  };

  return (
    <motion.div 
      style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 4vw, 40px)", maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px", paddingTop: "20px", width: "100%", boxSizing: "border-box" }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} style={{ textAlign: isMobile ? "center" : "left" }}>
        <h1 style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: "12px", fontSize: "clamp(2rem, 5vw, 3rem)", color: "#14213D", marginBottom: "8px", flexWrap: "wrap" }}>
          <User size={40} color="#3A86FF" /> Your Profile
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", color: "var(--text-muted)", fontWeight: "600" }}>All your info, accuracy, and rewards in one place.</p>
      </motion.div>

      <div style={{ display: "flex", gap: "clamp(20px, 3vw, 40px)", flexDirection: isMobile ? "column" : "row", width: "100%", boxSizing: "border-box" }}>
        <motion.div 
          style={{ flex: 1, padding: "clamp(18px, 4vw, 40px)", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "4px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", display: "flex", flexDirection: "column", boxSizing: "border-box", width: "100%" }} 
          variants={itemVariants}
        >
          <h3 style={{ borderBottom: "4px solid #14213D", paddingBottom: "16px", marginBottom: "24px", fontSize: "clamp(1.4rem, 3vw, 1.8rem)", color: "#14213D" }}>Account Details</h3>
          
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "1.05rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#F8FAFC", padding: "14px 16px", borderRadius: "16px", border: "3px solid #14213D", flexWrap: "wrap", wordBreak: "break-all" }}>
                <User size={22} color="#3A86FF" style={{ flexShrink: 0 }} />
                <strong style={{color: "#14213D"}}>Name:</strong> {user.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#F8FAFC", padding: "14px 16px", borderRadius: "16px", border: "3px solid #14213D", flexWrap: "wrap", wordBreak: "break-all" }}>
                <Mail size={22} color="#FF006E" style={{ flexShrink: 0 }} />
                <strong style={{color: "#14213D"}}>Email:</strong> {user.email}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#F8FAFC", padding: "14px 16px", borderRadius: "16px", border: "3px solid #14213D", flexWrap: "wrap", wordBreak: "break-all" }}>
                <Calendar size={22} color="#FFBE0B" style={{ flexShrink: 0 }} />
                <strong style={{color: "#14213D"}}>Joined:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "12px", padding: "16px 20px", background: "#D1FAE5", borderRadius: "16px", border: "3px solid #14213D", boxShadow: "4px 4px 0px #14213D", flexWrap: "wrap" }}
              >
                <Activity size={28} color="#059669" style={{ flexShrink: 0 }} />
                <strong style={{ fontSize: "1.2rem", color: "#059669" }}>Eco Score:</strong>
                <span style={{ fontSize: "1.6rem", fontWeight: "900", color: "#059669", marginLeft: "auto" }}>{ecoScore ?? "—"}</span>
              </motion.div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: "64px", background: "#e2e8f0", borderRadius: "16px", width: "100%", border: "3px solid #cbd5e1" }} />
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: "64px", background: "#e2e8f0", borderRadius: "16px", width: "100%", border: "3px solid #cbd5e1" }} />
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: "64px", background: "#e2e8f0", borderRadius: "16px", width: "100%", border: "3px solid #cbd5e1" }} />
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: "80px", background: "#e2e8f0", borderRadius: "16px", width: "100%", marginTop: "12px", border: "3px solid #cbd5e1" }} />
            </div>
          )}
        </motion.div>

        <motion.div 
          style={{ flex: 1.5, padding: "clamp(18px, 4vw, 40px)", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "4px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", display: "flex", flexDirection: "column", boxSizing: "border-box", width: "100%" }} 
          variants={itemVariants}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "4px solid #14213D", paddingBottom: "16px", marginBottom: "24px", fontSize: "clamp(1.4rem, 3vw, 1.8rem)", color: "#14213D" }}>
            <Medal size={30} color="#8338EC" /> Your Badges & Rewards
          </h3>
          
          {badges.length === 0 && user ? (
            <div style={{ textAlign: "center", padding: "clamp(30px, 6vw, 60px) 20px", color: "var(--text-muted)", background: "#F8FAFC", borderRadius: "16px", border: "3px dashed #cbd5e1" }}>
              <Star size={48} color="#cbd5e1" style={{ marginBottom: "16px" }} />
              <p style={{ fontSize: "clamp(1.1rem, 3vw, 1.3rem)", fontWeight: "600", color: "#64748b" }}>No badges yet — start logging trips to earn rewards!</p>
            </div>
          ) : badges.length === 0 && !user ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 160px), 1fr))", gap: "clamp(14px, 2.5vw, 24px)" }}>
              {[1,2,3,4].map(i => (
                 <motion.div key={i} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: "180px", background: "#e2e8f0", borderRadius: "16px", border: "3px solid #cbd5e1" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 160px), 1fr))", gap: "clamp(14px, 2.5vw, 24px)" }}>
              {badges.map((b) => (
                <motion.div 
                  key={b.id || b.name} 
                  whileHover={{ y: -6 }}
                  style={{ 
                    background: "#F8FAFC", 
                    border: "3px solid #14213D", 
                    borderRadius: "16px", 
                    padding: "24px 16px",
                    boxShadow: "4px 4px 0px #14213D",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: "12px",
                    transition: "all 0.2s"
                  }}
                >
                  <BadgeIcon name={b.name} />
                  <div style={{ fontWeight: "800", fontSize: "1.3rem", color: "#14213D" }}>{b.name}</div>
                  <div style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: "600" }}>{b.description}</div>
                  {b.achievedAt && (
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "auto", paddingTop: "12px", fontWeight: "bold" }}>
                      Earned {new Date(b.achievedAt).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;
