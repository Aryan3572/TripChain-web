import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { motion } from "framer-motion";
import {
  Medal,
  Star,
  Leaf,
  Zap,
  Flame,
  Crown,
  Globe,
  Rocket,
  ShieldCheck,
  Award,
  Wallet,
  CheckCircle,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import "../styles/achievements.css";

const BadgeIcon = ({ name }) => {
  const n = (name || "").toLowerCase();
  let Icon = Award;
  let bg = "#FFE4E6";
  let color = "#E11D48";
  let border = "#BE123C";

  if (n.includes('eco') || n.includes('green') || n.includes('leaf') || n.includes('tree') || n.includes('pathfinder')) {
    Icon = Leaf; bg = "#D1FAE5"; color = "#059669"; border = "#047857";
  } else if (n.includes('carbon') || n.includes('crusader') || n.includes('shield')) {
    Icon = ShieldCheck; bg = "#DCFCE7"; color = "#15803D"; border = "#166534";
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
  const [mintingId, setMintingId] = useState(null);
  const {
    account,
    isConnected,
    chainId,
    isDemoMode,
    connectWallet,
    connectDemoWallet,
    switchNetworkToLocalhost,
    mintBadgeNft,
    txPending,
    statusMessage,
  } = useWeb3();

  const loadBadges = async () => {
    try {
      const data = await apiRequest("/api/achievements");
      setBadges(data.badges || data.earnedBadges || []);
    } catch (err) {
      console.error("Achievements error:", err.message);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const handleMintNft = async (badge) => {
    if (!isConnected) {
      const conn = await connectWallet();
      if (!conn) return;
    }

    setMintingId(badge.id);
    try {
      const res = await mintBadgeNft(badge.id);
      if (res && res.success) {
        // Update local badge item to show minted state
        setBadges((prev) =>
          prev.map((b) =>
            b.id === badge.id
              ? { ...b, isMinted: true, tokenId: 1, txHash: res.txHash }
              : b
          )
        );
      }
    } finally {
      setMintingId(null);
    }
  };

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

  const mintedCount = badges.filter((b) => b.isMinted).length;

  return (
    <motion.div 
      style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 4vw, 40px)", maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px", paddingTop: "20px", width: "100%", boxSizing: "border-box" }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} style={{ textAlign: "center" }}>
        <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", fontSize: "clamp(2rem, 5vw, 3rem)", color: "#14213D", marginBottom: "8px", flexWrap: "wrap" }}>
          <Medal size={40} color="#FFBE0B" /> Your Achievements & NFT Badges
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", color: "var(--text-muted)", fontWeight: "600" }}>
          Earn milestone badges and mint them as permanent, Soulbound Web3 NFTs
        </p>
      </motion.div>

      {/* Web3 Overview Banner */}
      <motion.div
        variants={itemVariants}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
          border: "3px solid #14213D",
          borderRadius: "20px",
          padding: "20px 28px",
          boxShadow: "4px 4px 0px #14213D",
        }}
      >
        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#4F46E5", textTransform: "uppercase", letterSpacing: "0.5px" }}>Unlocked Badges</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#14213D" }}>{badges.length}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>On-Chain Soulbound NFTs</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#059669" }}>{mintedCount} / {badges.length}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isConnected ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", padding: "10px 16px", borderRadius: "14px", border: "2px solid #14213D", fontWeight: "700", fontSize: "0.9rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10B981", display: "inline-block" }}></span>
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "14px",
                background: "#6366F1",
                color: "#FFFFFF",
                border: "2px solid #14213D",
                fontWeight: "800",
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "3px 3px 0px #14213D",
              }}
            >
              <Wallet size={18} /> Connect Wallet to Mint
            </button>
          )}
        </div>
      </motion.div>

      {isConnected && !isDemoMode && chainId && chainId !== 31337 && (
        <div style={{
          background: "#FEF2F2",
          border: "2px solid #EF4444",
          padding: "16px 20px",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          flexWrap: "wrap",
          boxShadow: "3px 3px 0px #EF4444",
        }}>
          <div style={{ color: "#991B1B", fontWeight: "700", fontSize: "0.95rem" }}>
            ⚠️ <strong>MetaMask on Ethereum Mainnet:</strong> Smart contracts are deployed on Hardhat Localhost (Chain 31337). Switch network or use Demo Sandbox mode to avoid Blockaid warnings and gas fees.
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={switchNetworkToLocalhost}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                background: "#3A86FF",
                color: "#FFFFFF",
                border: "2px solid #14213D",
                fontWeight: "800",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Switch to Localhost
            </button>
            <button
              onClick={connectDemoWallet}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                background: "#10B981",
                color: "#FFFFFF",
                border: "2px solid #14213D",
                fontWeight: "800",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Use Demo Sandbox
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div style={{
          textAlign: "center",
          background: "#FEF3C7",
          border: "2px solid #D97706",
          padding: "12px 20px",
          borderRadius: "14px",
          fontWeight: "700",
          color: "#92400E",
        }}>
          ⏳ {statusMessage}
        </div>
      )}

      <motion.div 
        style={{ padding: "clamp(18px, 4vw, 40px)", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "4px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", boxSizing: "border-box", width: "100%" }} 
        variants={itemVariants}
      >
        {badges.length === 0 && (
          <div style={{ textAlign: "center", padding: "clamp(30px, 6vw, 60px) 20px", color: "var(--text-muted)", background: "#F8FAFC", borderRadius: "16px", border: "3px dashed #cbd5e1" }}>
            <Star size={48} color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <p style={{ fontSize: "clamp(1.1rem, 3vw, 1.3rem)", fontWeight: "600", color: "#64748b" }}>No achievements yet. Start traveling eco-friendly to earn some!</p>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))", gap: "clamp(16px, 2.5vw, 24px)" }}>
          {badges.map((b) => (
            <motion.div 
              key={b.id || b.name} 
              whileHover={{ y: -6 }}
              style={{ 
                background: b.isMinted ? "#F0FDF4" : "#F8FAFC", 
                border: b.isMinted ? "3px solid #059669" : "3px solid #14213D", 
                borderRadius: "18px", 
                padding: "24px 16px",
                boxShadow: b.isMinted ? "4px 4px 0px #059669" : "4px 4px 0px #14213D",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "12px",
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {b.isMinted && (
                <div style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "#DCFCE7",
                  color: "#15803D",
                  border: "1.5px solid #16A34A",
                  padding: "4px 8px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  <CheckCircle size={13} /> NFT Minted
                </div>
              )}

              <BadgeIcon name={b.name} />
              <div style={{ fontWeight: "800", fontSize: "1.3rem", color: "#14213D" }}>{b.name}</div>
              <div style={{ fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: "600", minHeight: "40px" }}>{b.description}</div>

              {b.achievedAt && (
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "auto", paddingTop: "8px", fontWeight: "bold" }}>
                  Earned {new Date(b.achievedAt).toLocaleDateString()}
                </div>
              )}

              {/* Web3 Mint Button / Status */}
              <div style={{ width: "100%", marginTop: "12px" }}>
                {b.isMinted ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "10px 12px",
                    background: "#059669",
                    color: "#FFFFFF",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    border: "2px solid #047857",
                  }}>
                    ✨ Soulbound NFT #{b.tokenId || 1}
                  </div>
                ) : (
                  <button
                    onClick={() => handleMintNft(b)}
                    disabled={txPending || mintingId === b.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      width: "100%",
                      padding: "10px 12px",
                      background: "#FFBE0B",
                      color: "#14213D",
                      borderRadius: "12px",
                      fontSize: "0.9rem",
                      fontWeight: "800",
                      border: "2px solid #14213D",
                      cursor: "pointer",
                      boxShadow: "3px 3px 0px #14213D",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {mintingId === b.id ? "Minting..." : "⬡ Mint as NFT"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Achievements;
