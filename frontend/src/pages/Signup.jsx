import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import { motion } from "framer-motion";
import { UserPlus, User, Mail, Lock, CheckCircle2 } from "lucide-react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] = useState("normal");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      await apiRequest("/api/auth/register", "POST", { name, email, password });
      setMascotState("happy");
      setMsg("Account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMsg(err.message || "Signup failed");
      setMascotState("normal");
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="auth-panel"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: "flex", gap: "40px", maxWidth: "1000px", margin: "80px auto", padding: "20px" }}
      >
        <div className="auth-info" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
            style={{ width: "100%", maxWidth: "400px", marginBottom: "30px" }}
          >
            <div style={{
              background: "#FFFFFF",
              border: "4px solid #14213D",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "8px 8px 0px #14213D",
              position: "relative",
              zIndex: 2,
            }}>
              <h1 style={{ fontSize: "2rem", color: "#10B981", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "2.5rem" }}>--</span> Let's explore!
              </h1>
              <p style={{ fontSize: "1.1rem", color: "var(--text-main)", lineHeight: "1.6", fontWeight: "600", margin: 0 }}>
                Join the Tripchain community today! Together we can track your trips, lower our carbon footprint, and earn some awesome blockchain NFT badges!
              </p>
              {/* Speech bubble tail shadow */}
              <div style={{
                position: "absolute",
                bottom: "-24px",
                left: "50%",
                transform: "translateX(-50%)",
                borderWidth: "24px 24px 0",
                borderStyle: "solid",
                borderColor: "#14213D transparent transparent transparent",
                width: 0,
                zIndex: 1
              }}></div>
              {/* Speech bubble tail inner */}
              <div style={{
                position: "absolute",
                bottom: "-16px",
                left: "50%",
                transform: "translateX(-50%)",
                borderWidth: "18px 18px 0",
                borderStyle: "solid",
                borderColor: "#FFFFFF transparent transparent transparent",
                width: 0,
                zIndex: 3
              }}></div>
            </div>
          </motion.div>

          <motion.img
            initial={{ y: 50, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: mascotState === "happy" ? [1, 1.1, 1] : mascotState === "focused" ? 1.05 : mascotState === "hidden" ? 0.9 : 1,
              rotateZ: mascotState === "hidden" ? -10 : 0,
              filter: mascotState === "hidden" ? "brightness(0.7) blur(3px)" : "brightness(1) blur(0px)",
            }}
            transition={{ type: "spring", bounce: 0.6, delay: 0.1 }}
            src="/mascot.png"
            alt="Tripchain Mascot"
            style={{
              width: "250px",
              height: "250px",
              objectFit: "cover",
              borderRadius: "50%",
              border: "4px solid #14213D",
              boxShadow: "6px 6px 0px #14213D",
              background: "#FDFCDC"
            }}
          />
        </div>

        <motion.div
          className="auth-card glass-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ flex: 1, padding: "50px 40px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#FFFFFF", borderRadius: "24px", border: "3px solid #14213D", boxShadow: "8px 8px 0px #14213D" }}
        >
          <h1 className="auth-title" style={{ fontSize: "2.5rem", marginBottom: "10px", color: "#14213D" }}>Create your account</h1>
          <p className="auth-subtitle" style={{ color: "var(--text-muted)", marginBottom: "30px", fontSize: "1.1rem" }}>Join Tripchain and start tracking your journeys.</p>

          <form className="auth-form" onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
              Full name
              <div style={{ position: "relative" }}>
                <User size={20} color="var(--text-muted)" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)" }}
                  onFocus={(e) => { e.target.style.borderColor = "#10B981"; e.target.style.background = "#FFFFFF"; setMascotState("focused"); }}
                  onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; setMascotState("normal"); }}
                />
              </div>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
              Email
              <div style={{ position: "relative" }}>
                <Mail size={20} color="var(--text-muted)" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)" }}
                  onFocus={(e) => { e.target.style.borderColor = "#10B981"; e.target.style.background = "#FFFFFF"; setMascotState("focused"); }}
                  onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; setMascotState("normal"); }}
                />
              </div>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
              Password
              <div style={{ position: "relative" }}>
                <Lock size={20} color="var(--text-muted)" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)" }}
                  onFocus={(e) => { e.target.style.borderColor = "#10B981"; e.target.style.background = "#FFFFFF"; setMascotState("hidden"); }}
                  onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; setMascotState("normal"); }}
                />
              </div>
            </label>

            {msg && <div className="info-text" style={{ color: msg.includes("failed") ? '#EF4444' : '#10B981', background: msg.includes("failed") ? "#FEF2F2" : "#D1FAE5", padding: "12px", borderRadius: "12px", border: `3px solid ${msg.includes("failed") ? "#FCA5A5" : "#6EE7B7"}`, fontWeight: "bold" }}>{msg}</div>}

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 2 }}
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", padding: "16px", fontSize: "1.2rem", fontWeight: "bold", marginTop: "10px", borderRadius: "16px", background: "#10B981", borderColor: "#059669" }}
            >
              <UserPlus size={22} />
              {loading ? "Creating..." : "Sign up"}
            </motion.button>
          </form>

          <div className="auth-footer" style={{ marginTop: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "1rem", fontWeight: "600" }}>
            Already have an account? <Link to="/login" style={{ color: "#10B981", fontWeight: "bold", textDecoration: "none" }}>Log in</Link>
          </div>
        </motion.div>
    </motion.div>
  );
};

export default Signup;
