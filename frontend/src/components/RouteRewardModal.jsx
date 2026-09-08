import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Leaf, Zap, Award, LayoutDashboard, X, ShieldCheck, Bus, Footprints } from "lucide-react";

const MiniBadgeIcon = ({ name }) => {
  const n = (name || "").toLowerCase();
  let Icon = Award;
  let bg = "#FFE4E6";
  let color = "#E11D48";

  if (n.includes('eco') || n.includes('green') || n.includes('pathfinder') || n.includes('leaf') || n.includes('tree')) {
    Icon = Leaf; bg = "#D1FAE5"; color = "#059669";
  } else if (n.includes('carbon') || n.includes('crusader') || n.includes('shield')) {
    Icon = ShieldCheck; bg = "#DCFCE7"; color = "#15803D";
  } else if (n.includes('fast') || n.includes('speed') || n.includes('zap')) {
    Icon = Zap; bg = "#DBEAFE"; color = "#2563EB";
  } else if (n.includes('public') || n.includes('bus') || n.includes('transport')) {
    Icon = Bus; bg = "#EDE9FE"; color = "#7C3AED";
  } else if (n.includes('active') || n.includes('walk') || n.includes('commuter')) {
    Icon = Footprints; bg = "#FEF3C7"; color = "#D97706";
  }

  return (
    <div style={{
      width: "38px",
      height: "38px",
      borderRadius: "10px",
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      border: "2px solid #14213D",
    }}>
      <Icon size={20} color={color} strokeWidth={2.5} />
    </div>
  );
};

const RouteRewardModal = ({ isOpen, onClose, rewardData }) => {
  const navigate = useNavigate();

  if (!isOpen || !rewardData) return null;

  const { isEco, pointsEarned, co2Saved, newBadges = [] } = rewardData;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(20, 33, 61, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "clamp(12px, 3vw, 20px)",
            boxSizing: "border-box",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="glass-card"
            style={{
              background: "#FFFFFF",
              padding: "clamp(24px, 4vw, 36px) clamp(16px, 4vw, 30px)",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(14px, 2.5vw, 20px)",
              textAlign: "center",
              border: "4px solid #14213D",
              boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D",
              borderRadius: "28px",
              position: "relative",
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "#F1F5F9",
                border: "2px solid #14213D",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <X size={18} color="#14213D" />
            </button>

            {/* Top Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.1, duration: 0.4 }}
              style={{
                width: "clamp(64px, 15vw, 80px)",
                height: "clamp(64px, 15vw, 80px)",
                borderRadius: "50%",
                background: isEco ? "#D1FAE5" : "#DBEAFE",
                border: `4px solid ${isEco ? "#059669" : "#2563EB"}`,
                boxShadow: `4px 4px 0px #14213D`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isEco ? (
                <Leaf size={38} color="#059669" />
              ) : (
                <Zap size={38} color="#2563EB" />
              )}
            </motion.div>

            <h2 style={{ margin: 0, fontSize: "clamp(1.4rem, 4vw, 1.8rem)", color: "#14213D", fontFamily: "'Outfit', sans-serif" }}>
              {isEco ? "Eco Journey Recorded!" : "Fastest Route Saved!"}
            </h2>

            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "clamp(0.9rem, 2vw, 1rem)", fontWeight: "600" }}>
              {isEco
                ? "You chose the sustainable path and helped reduce emissions!"
                : "Your trip has been safely recorded to your travel log."}
            </p>

            {/* Rewards Highlights */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", width: "100%" }}>
              <div
                style={{
                  flex: "1 1 130px",
                  padding: "clamp(12px, 3vw, 16px)",
                  background: isEco ? "#ECFDF5" : "#EFF6FF",
                  border: `3px solid ${isEco ? "#10B981" : "#3B82F6"}`,
                  borderRadius: "16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: "3px 3px 0px #14213D",
                  boxSizing: "border-box",
                }}
              >
                <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                  Points Earned
                </span>
                <span
                  style={{
                    fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)",
                    fontWeight: "900",
                    color: isEco ? "#059669" : "#2563EB",
                    marginTop: "4px",
                  }}
                >
                  +{pointsEarned || (isEco ? 50 : 10)}
                </span>
              </div>

              {isEco && co2Saved > 0 && (
                <div
                  style={{
                    flex: "1 1 130px",
                    padding: "clamp(12px, 3vw, 16px)",
                    background: "#F0FDF4",
                    border: "3px solid #16A34A",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    boxShadow: "3px 3px 0px #14213D",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                    CO₂ Prevented
                  </span>
                  <span
                    style={{
                      fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)",
                      fontWeight: "900",
                      color: "#16A34A",
                      marginTop: "4px",
                    }}
                  >
                    {co2Saved} <span style={{ fontSize: "0.95rem" }}>kg</span>
                  </span>
                </div>
              )}
            </div>

            {/* Newly Unlocked Badges */}
            {newBadges && newBadges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  width: "100%",
                  background: "#FEF3C7",
                  border: "3px solid #D97706",
                  borderRadius: "18px",
                  padding: "14px",
                  boxShadow: "3px 3px 0px #14213D",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "800", color: "#B45309" }}>
                  <Award size={20} /> New Badge Unlocked!
                </div>
                {newBadges.map((badge, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", background: "#FFFFFF", padding: "8px 12px", borderRadius: "12px", border: "2px solid #14213D" }}>
                    <MiniBadgeIcon name={badge.name} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "#14213D" }}>{badge.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{badge.description}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "10px" }}>
              <button
                onClick={() => {
                  onClose();
                  navigate("/");
                }}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: isEco ? "#10B981" : "#3A86FF",
                }}
              >
                <LayoutDashboard size={20} /> Go to Dashboard
              </button>

              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  borderRadius: "14px",
                  background: "#F8FAFC",
                  border: "2px solid #14213D",
                  color: "#14213D",
                  cursor: "pointer",
                }}
              >
                Plan Another Trip
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RouteRewardModal;
