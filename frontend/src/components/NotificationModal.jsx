import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

const NotificationModal = ({ isOpen, onClose, message }) => {
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
            background: "rgba(20, 33, 61, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="glass-card"
            style={{
              background: "#FFFFFF",
              padding: "32px",
              width: "90%",
              maxWidth: "400px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              textAlign: "center",
              border: "3px solid #14213D",
              boxShadow: "6px 6px 0px #14213D",
              borderRadius: "24px"
            }}
          >
            <CheckCircle2 size={64} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: "1.5rem", color: "#14213D", fontFamily: "'Outfit', sans-serif" }}>Success!</h3>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "1.1rem" }}>{message}</p>
            
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "10px", display: "flex", justifyContent: "center", gap: "8px" }}
            >
              <X size={20} /> Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;
