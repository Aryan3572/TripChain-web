import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { motion } from "framer-motion";
import { Medal, Star, Leaf, Zap, Flame, Crown, Globe, Rocket, ShieldCheck, Award } from "lucide-react";
import "../styles/achievements.css";

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

const Achievements = () => {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest("/api/achievements");
        setBadges(data.badges || data.earnedBadges || []);
      } catch (err) {
        console.error("Achievements error:", err.message);
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
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} style={{ textAlign: "center" }}>
        <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", fontSize: "3rem", color: "#14213D", marginBottom: "8px" }}>
          <Medal size={48} color="#FFBE0B" /> Your Achievements
        </h1>
        <p style={{ fontSize: "1.2rem", color: "var(--text-muted)", fontWeight: "600" }}>Badges you’ve unlocked by traveling smarter ✨</p>
      </motion.div>

      <motion.div 
        style={{ padding: "40px", background: "#FFFFFF", borderRadius: "24px", border: "4px solid #14213D", boxShadow: "8px 8px 0px #14213D" }} 
        variants={itemVariants}
      >
        {badges.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", background: "#F8FAFC", borderRadius: "16px", border: "3px dashed #cbd5e1" }}>
            <Star size={64} color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <p style={{ fontSize: "1.3rem", fontWeight: "600", color: "#64748b" }}>No achievements yet. Start traveling eco-friendly to earn some!</p>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px" }}>
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
      </motion.div>
    </motion.div>
  );
};

export default Achievements;
