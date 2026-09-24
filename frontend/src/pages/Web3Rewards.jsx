import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  Leaf,
  Flame,
  Wallet,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { apiRequest } from "../api/api";

const Web3Rewards = () => {
  const {
    account,
    chainId,
    isConnected,
    isDemoMode,
    tripBalance,
    rewardStats,
    txPending,
    statusMessage,
    contractAddresses,
    connectWallet,
    connectDemoWallet,
    switchNetworkToLocalhost,
    claimRewards,
    offsetCarbon,
    refreshBalance,
    fetchRewardStats,
  } = useWeb3();

  // Offset form state
  const [offsetTripAmount, setOffsetTripAmount] = useState(20);
  const [projectCategory, setProjectCategory] = useState("Urban Reforestation & Green Corridors");
  const [offsetMemo, setOffsetMemo] = useState("Carbon Neutral Daily Commute");
  const [offsetHistory, setOffsetHistory] = useState([]);

  // 10 $TRIP = 1.0 kg CO2 offset
  const calculatedCo2Kg = (offsetTripAmount / 10).toFixed(1);

  const loadOffsets = async () => {
    try {
      const data = await apiRequest("/api/web3/offsets");
      if (data && data.offsets) {
        setOffsetHistory(data.offsets);
      }
    } catch (e) {
      console.warn("Could not load offsets:", e.message);
    }
  };

  useEffect(() => {
    loadOffsets();
  }, []);

  const handleClaim = async () => {
    await claimRewards();
  };

  const handleOffset = async (e) => {
    e.preventDefault();
    if (!offsetTripAmount || offsetTripAmount <= 0) {
      alert("Please enter a valid amount of $TRIP to burn");
      return;
    }

    if (parseFloat(tripBalance) < parseFloat(offsetTripAmount)) {
      alert(`Insufficient $TRIP balance. You currently have ${tripBalance} $TRIP.`);
      return;
    }

    const res = await offsetCarbon({
      tripAmount: offsetTripAmount,
      co2Kg: parseFloat(calculatedCo2Kg),
      category: projectCategory,
      memo: offsetMemo,
    });

    if (res && res.success) {
      await loadOffsets();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } },
  };

  return (
    <motion.div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        maxWidth: "1200px",
        margin: "0 auto",
        paddingBottom: "60px",
        paddingTop: "20px",
        width: "100%",
        boxSizing: "border-box",
      }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ textAlign: "center" }}>
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            color: "#14213D",
            marginBottom: "8px",
            flexWrap: "wrap",
          }}
        >
          <Coins size={40} color="#F59E0B" /> Web3 Eco-Rewards & Carbon Offset
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", color: "var(--text-muted)", fontWeight: "600" }}>
          Earn tokenized incentives for green mobility and permanently offset carbon on-chain
        </p>
      </motion.div>

      {/* Wallet Status / Connector */}
      <motion.div
        variants={itemVariants}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "#FFFFFF",
          border: "4px solid #14213D",
          borderRadius: "24px",
          padding: "24px 32px",
          boxShadow: "6px 6px 0px #14213D",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: isConnected ? "#DCFCE7" : "#FEF3C7",
              border: `3px solid ${isConnected ? "#16A34A" : "#D97706"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wallet size={30} color={isConnected ? "#15803D" : "#B45309"} />
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Web3 Wallet Status
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#14213D" }}>
              {isConnected ? `${account.slice(0, 8)}...${account.slice(-6)}` : "Wallet Not Connected"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!isConnected ? (
            <button
              onClick={connectWallet}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 24px",
                borderRadius: "16px",
                background: "#6366F1",
                color: "#FFFFFF",
                border: "3px solid #14213D",
                fontWeight: "800",
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "4px 4px 0px #14213D",
              }}
            >
              <Wallet size={20} /> Connect Web3 Wallet
            </button>
          ) : (
            <button
              onClick={() => {
                refreshBalance();
                fetchRewardStats();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "14px",
                background: "#F8FAFC",
                color: "#14213D",
                border: "2px solid #14213D",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={16} /> Sync Balances
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

      {/* Live Transaction Status Alert */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: "center",
            background: "#FEF3C7",
            border: "3px solid #D97706",
            padding: "16px 24px",
            borderRadius: "18px",
            fontWeight: "800",
            fontSize: "1.05rem",
            color: "#92400E",
            boxShadow: "4px 4px 0px #D97706",
          }}
        >
          ⏳ {statusMessage}
        </motion.div>
      )}

      {/* Grid: Token Balance & Claim + Carbon Offset */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 450px), 1fr))", gap: "28px" }}>
        {/* Card 1: $TRIP Token Balance & Claiming */}
        <motion.div
          variants={itemVariants}
          style={{
            background: "#FFFFFF",
            border: "4px solid #14213D",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "6px 6px 0px #14213D",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Your On-Chain Balance
              </div>
              <div style={{ fontSize: "2.8rem", fontWeight: "900", color: "#14213D", display: "flex", alignItems: "baseline", gap: "8px" }}>
                {tripBalance} <span style={{ fontSize: "1.3rem", color: "#F59E0B" }}>$TRIP</span>
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: "#FEF3C7",
                border: "3px solid #F59E0B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Coins size={32} color="#D97706" />
            </div>
          </div>

          <div
            style={{
              background: "#F8FAFC",
              border: "2px solid #E2E8F0",
              borderRadius: "18px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span style={{ color: "#64748b", fontWeight: "600" }}>Total CO₂ Saved:</span>
              <span style={{ fontWeight: "800", color: "#059669" }}>{rewardStats?.totalCo2SavedKg || "0.0"} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span style={{ color: "#64748b", fontWeight: "600" }}>Lifetime Rewards Earned:</span>
              <span style={{ fontWeight: "800", color: "#14213D" }}>{rewardStats?.totalEarnedTrip || 0} $TRIP</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span style={{ color: "#64748b", fontWeight: "600" }}>Already Claimed:</span>
              <span style={{ fontWeight: "800", color: "#64748b" }}>{rewardStats?.claimedTokens || 0} $TRIP</span>
            </div>
            <hr style={{ border: "none", borderTop: "2px dashed #CBD5E1", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
              <span style={{ color: "#14213D", fontWeight: "800" }}>Unclaimed Rewards:</span>
              <span style={{ fontWeight: "900", color: "#2563EB" }}>
                {rewardStats?.pendingClaimableTrip || 0} $TRIP
              </span>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={txPending || !rewardStats?.pendingClaimableTrip || rewardStats?.pendingClaimableTrip <= 0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "16px 24px",
              borderRadius: "16px",
              background: (rewardStats?.pendingClaimableTrip > 0) ? "#22C55E" : "#E2E8F0",
              color: (rewardStats?.pendingClaimableTrip > 0) ? "#FFFFFF" : "#94A3B8",
              border: "3px solid #14213D",
              fontWeight: "900",
              fontSize: "1.1rem",
              cursor: (rewardStats?.pendingClaimableTrip > 0) ? "pointer" : "not-allowed",
              boxShadow: (rewardStats?.pendingClaimableTrip > 0) ? "4px 4px 0px #14213D" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={22} />
            {txPending
              ? "Confirming On-Chain..."
              : rewardStats?.pendingClaimableTrip > 0
              ? `Claim ${rewardStats.pendingClaimableTrip} $TRIP to Wallet`
              : "No Rewards Ready to Claim"}
          </button>
        </motion.div>

        {/* Card 2: Carbon Offset Burn Portal */}
        <motion.div
          variants={itemVariants}
          style={{
            background: "#FFFFFF",
            border: "4px solid #14213D",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "6px 6px 0px #14213D",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Decentralized Climate Action
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#14213D" }}>
                Burn $TRIP to Offset CO₂
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: "#DCFCE7",
                border: "3px solid #16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Leaf size={32} color="#15803D" />
            </div>
          </div>

          <form onSubmit={handleOffset} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", color: "#14213D", fontSize: "0.95rem" }}>
              Amount of $TRIP to Retire:
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={offsetTripAmount}
                  onChange={(e) => setOffsetTripAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "3px solid #14213D",
                    fontSize: "1.1rem",
                    fontWeight: "800",
                    background: "#F8FAFC",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", fontWeight: "800", color: "#F59E0B" }}>
                  $TRIP
                </span>
              </div>
            </label>

            {/* Impact Calculation Preview */}
            <div
              style={{
                background: "#F0FDF4",
                border: "2px solid #86EFAC",
                borderRadius: "16px",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#166534", textTransform: "uppercase" }}>
                  Estimated Climate Impact
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#15803D" }}>
                  {calculatedCo2Kg} kg CO₂ Neutralized
                </div>
              </div>
              <ShieldCheck size={36} color="#16A34A" />
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", color: "#14213D", fontSize: "0.95rem" }}>
              Supported Project Category:
              <select
                value={projectCategory}
                onChange={(e) => setProjectCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "3px solid #14213D",
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  background: "#F8FAFC",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="Urban Reforestation & Green Corridors">Urban Reforestation & Green Corridors</option>
                <option value="Clean Public Transit Micro-Grants">Clean Public Transit Micro-Grants</option>
                <option value="Solar-Powered Bicycle Infrastructure">Solar-Powered Bicycle Infrastructure</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", color: "#14213D", fontSize: "0.95rem" }}>
              Certificate Memo / Note:
              <input
                type="text"
                value={offsetMemo}
                onChange={(e) => setOffsetMemo(e.target.value)}
                placeholder="e.g. Commute Offset, Personal Net Zero 2026"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "3px solid #14213D",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  background: "#F8FAFC",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={txPending || !isConnected}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "16px 24px",
                borderRadius: "16px",
                background: isConnected ? "#059669" : "#94A3B8",
                color: "#FFFFFF",
                border: "3px solid #14213D",
                fontWeight: "900",
                fontSize: "1.05rem",
                cursor: isConnected ? "pointer" : "not-allowed",
                boxShadow: isConnected ? "4px 4px 0px #14213D" : "none",
                transition: "all 0.15s ease",
                marginTop: "8px",
              }}
            >
              <Flame size={20} />
              {txPending ? "Retiring On-Chain..." : `Burn ${offsetTripAmount} $TRIP for Certificate`}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Verified On-Chain Offset Certificates */}
      <motion.div
        variants={itemVariants}
        style={{
          background: "#FFFFFF",
          border: "4px solid #14213D",
          borderRadius: "24px",
          padding: "32px",
          boxShadow: "6px 6px 0px #14213D",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: "900", color: "#14213D", margin: 0 }}>
              📜 Your On-Chain Carbon Offset Certificates
            </h2>
            <p style={{ color: "var(--text-muted)", fontWeight: "600", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
              Permanent, tamper-proof records of your retired emissions recorded on smart contract
            </p>
          </div>
          <button
            onClick={loadOffsets}
            style={{
              padding: "8px 16px",
              background: "#F8FAFC",
              border: "2px solid #14213D",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {offsetHistory.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "#F8FAFC",
              borderRadius: "18px",
              border: "2px dashed #CBD5E1",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            No carbon offset certificates issued yet. Burn some $TRIP to generate your first on-chain certificate!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "16px" }}>
            {offsetHistory.map((cert) => (
              <div
                key={cert.id}
                style={{
                  background: "#F0FDF4",
                  border: "2px solid #16A34A",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "3px 3px 0px #16A34A",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ background: "#DCFCE7", color: "#15803D", padding: "4px 10px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "800" }}>
                    CERT #{cert.certificateId.slice(-6)}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700" }}>
                    {new Date(cert.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#15803D" }}>
                  {cert.co2OffsetKg} kg CO₂ Retired
                </div>

                <div style={{ fontSize: "0.85rem", color: "#14213D", fontWeight: "700" }}>
                  Burned: <span style={{ color: "#D97706" }}>{cert.tokensBurned} $TRIP</span>
                </div>

                <div style={{ fontSize: "0.75rem", color: "#64748b", wordBreak: "break-all", background: "#FFFFFF", padding: "8px", borderRadius: "8px", border: "1px solid #BBF7D0" }}>
                  Tx: {cert.txHash.slice(0, 16)}...{cert.txHash.slice(-8)}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Smart Contracts Transparency Info */}
      <motion.div
        variants={itemVariants}
        style={{
          background: "#F8FAFC",
          border: "3px solid #14213D",
          borderRadius: "20px",
          padding: "24px 32px",
          boxShadow: "4px 4px 0px #14213D",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h3 style={{ fontSize: "1.1rem", fontWeight: "900", color: "#14213D", margin: 0 }}>
          🛡️ Verified Smart Contract Deployments
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", fontFamily: "monospace" }}>
          <div>
            <strong>$TRIP Token:</strong> {contractAddresses?.TripToken || "Not deployed"}
          </div>
          <div>
            <strong>$TBADGE NFT:</strong> {contractAddresses?.TripBadgeNFT || "Not deployed"}
          </div>
          <div>
            <strong>Carbon Offset Registry:</strong> {contractAddresses?.CarbonOffsetRegistry || "Not deployed"}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Web3Rewards;
