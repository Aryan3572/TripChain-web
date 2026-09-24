import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wallet,
  ExternalLink,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";

export const Web3WalletModal = ({
  isOpen,
  onClose,
  onConnectReal,
  onConnectDemo,
  isConnecting,
}) => {
  const [showFaq, setShowFaq] = useState(false);
  const hasInjectedWallet = typeof window !== "undefined" && !!window.ethereum;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(20, 33, 61, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px",
          boxSizing: "border-box",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            background: "#FFFFFF",
            border: "4px solid #14213D",
            borderRadius: "28px",
            boxShadow: "8px 8px 0px #14213D",
            width: "100%",
            maxWidth: "480px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "clamp(20px, 4vw, 32px)",
            position: "relative",
            boxSizing: "border-box",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: "2px solid #14213D",
              background: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "2px 2px 0px #14213D",
            }}
          >
            <X size={20} color="#14213D" />
          </button>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "22px",
                background: "#FEF3C7",
                border: "3px solid #D97706",
                boxShadow: "4px 4px 0px #D97706",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}
            >
              <Wallet size={36} color="#B45309" />
            </div>
            <h2
              style={{
                fontSize: "1.6rem",
                fontWeight: "900",
                color: "#14213D",
                margin: "0 0 6px 0",
              }}
            >
              {hasInjectedWallet ? "Connect Web3 Wallet" : "MetaMask Not Detected"}
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.95rem",
                fontWeight: "600",
                margin: 0,
                lineHeight: "1.4",
              }}
            >
              {hasInjectedWallet
                ? "Connect your Ethereum wallet to start earning $TRIP rewards and minting NFT badges."
                : "You need a Web3 wallet extension to interact with the blockchain, or you can try our interactive Demo Mode right now!"}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {hasInjectedWallet ? (
              <button
                onClick={onConnectReal}
                disabled={isConnecting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "16px 20px",
                  borderRadius: "16px",
                  border: "3px solid #14213D",
                  background: "#F59E0B",
                  color: "#14213D",
                  fontSize: "1.05rem",
                  fontWeight: "900",
                  cursor: "pointer",
                  boxShadow: "4px 4px 0px #14213D",
                  transition: "all 0.15s ease",
                }}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                  alt="MetaMask"
                  style={{ width: "24px", height: "24px" }}
                />
                {isConnecting ? "Connecting to MetaMask..." : "Connect MetaMask Wallet"}
              </button>
            ) : (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "16px 20px",
                  borderRadius: "16px",
                  border: "3px solid #14213D",
                  background: "#FFBE0B",
                  color: "#14213D",
                  fontSize: "1.05rem",
                  fontWeight: "900",
                  textDecoration: "none",
                  boxShadow: "4px 4px 0px #14213D",
                  textAlign: "center",
                }}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                  alt="MetaMask"
                  style={{ width: "24px", height: "24px" }}
                />
                Install MetaMask (Free Extension)
                <ExternalLink size={18} />
              </a>
            )}

            {/* Demo Sandbox Mode Button */}
            <button
              onClick={onConnectDemo}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "14px 20px",
                borderRadius: "16px",
                border: "3px solid #14213D",
                background: "#EEF2FF",
                color: "#4338CA",
                fontSize: "1rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: "3px 3px 0px #14213D",
                transition: "all 0.15s ease",
              }}
            >
              <Sparkles size={18} color="#6366F1" />
              Try Demo Sandbox Wallet (1-Click)
            </button>
          </div>

          {/* Quick Setup Instructions for Beginners */}
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#F8FAFC",
              borderRadius: "16px",
              border: "2px solid #E2E8F0",
              fontSize: "0.85rem",
              color: "#475569",
              lineHeight: "1.5",
            }}
          >
            <div style={{ fontWeight: "800", color: "#14213D", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={16} color="#059669" /> 3-Step Setup for Beginners:
            </div>
            <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <li>Install MetaMask from <strong>metamask.io/download</strong> (for Chrome, Edge, or Brave).</li>
              <li>Create your free wallet (takes 30 seconds, no credit card required).</li>
              <li>Refresh this page and click <strong>"Connect Wallet"</strong>!</li>
            </ol>
          </div>

          {/* Accordion: What is Web3 & Why do I need it? */}
          <div style={{ marginTop: "14px" }}>
            <button
              onClick={() => setShowFaq(!showFaq)}
              style={{
                background: "none",
                border: "none",
                color: "#6366F1",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                width: "100%",
                justifyContent: "center",
                padding: "4px",
              }}
            >
              <HelpCircle size={15} />
              What is a Web3 wallet & why is it useful?
              {showFaq ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showFaq && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{
                  marginTop: "8px",
                  padding: "12px 14px",
                  background: "#F1F5F9",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  color: "#334155",
                  lineHeight: "1.4",
                }}
              >
                In Tripchain, your Web3 wallet acts as your digital passport and reward vault.
                Instead of simple numbers on a screen, your green travel earns real tokenized rewards (<strong>$TRIP</strong>)
                and permanent milestone trophies (<strong>NFT Badges</strong>) that you verifiably own on the blockchain!
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Web3WalletModal;
