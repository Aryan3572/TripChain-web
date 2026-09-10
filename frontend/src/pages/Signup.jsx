import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { validateEmailAddress } from "../utils/emailValidator";
import { motion } from "framer-motion";
import { UserPlus, User, Mail, Lock } from "lucide-react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] = useState("normal");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setMsg("");
    setIsError(false);

    const emailCheck = validateEmailAddress(email);
    if (!emailCheck.valid) {
      setMsg(emailCheck.message);
      setIsError(true);
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/api/auth/register", "POST", { 
        name, 
        email: emailCheck.normalizedEmail, 
        password 
      });
      setMascotState("happy");
      setMsg("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMsg(err.message || "Signup failed");
      setIsError(true);
      setMascotState("normal");
    }
    setLoading(false);
  };

  const handleGoogleSignup = async (credential) => {
    setMsg("");
    setIsError(false);
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/google", "POST", { credential });
      setMascotState("happy");
      localStorage.setItem("tripchain_token", data.token);
      if (data.user?.email) localStorage.setItem("tripchain_userEmail", data.user.email);
      setMsg("Google account ready! Redirecting...");
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      setMsg(err.message || "Google sign-up failed");
      setIsError(true);
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
      style={{ maxWidth: "1000px" }}
    >
      <div className="auth-info desktop-auth-info">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
          style={{ width: "100%", maxWidth: "420px", marginBottom: "clamp(16px, 3vw, 24px)" }}
        >
          <div style={{
            background: "#FFFFFF",
            border: "4px solid #14213D",
            borderRadius: "24px",
            padding: "clamp(16px, 3vw, 24px)",
            boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D",
            position: "relative",
            zIndex: 2,
            boxSizing: "border-box",
          }}>
            <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "#10B981", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}>--</span> Let's explore!
            </h1>
            <p style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "var(--text-main)", lineHeight: "1.5", fontWeight: "600", margin: 0 }}>
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
            width: "clamp(150px, 30vw, 240px)",
            height: "clamp(150px, 30vw, 240px)",
            objectFit: "cover",
            borderRadius: "50%",
            border: "4px solid #14213D",
            boxShadow: "clamp(4px, 1vw, 6px) clamp(4px, 1vw, 6px) 0px #14213D",
            background: "#FDFCDC"
          }}
        />
      </div>

      <motion.div
        className="auth-card glass-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ flex: 1, padding: "clamp(24px, 4vw, 44px) clamp(16px, 4vw, 36px)", display: "flex", flexDirection: "column", justifyContent: "center", background: "#FFFFFF", borderRadius: "clamp(18px, 3vw, 24px)", border: "3px solid #14213D", boxShadow: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0px #14213D", width: "100%", boxSizing: "border-box" }}
      >
        {/* Mobile Mascot Buddy Header */}
        <div className="mobile-mascot-header">
          <motion.img
            src="/mascot.png"
            alt="Tripchain Mascot"
            className="mobile-mascot-avatar"
            animate={{
              scale: mascotState === "happy" ? [1, 1.15, 1] : mascotState === "focused" ? 1.08 : 1,
            }}
            transition={{ type: "spring", bounce: 0.5 }}
          />
          <div className="mobile-mascot-bubble">
            <span className="mobile-bubble-title">Let's explore! 🌿</span>
            <span className="mobile-bubble-desc">Create your account and earn rewards.</span>
          </div>
        </div>

        <h1 className="auth-title" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", marginBottom: "8px", color: "#14213D" }}>Create your account</h1>
        <p className="auth-subtitle" style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "clamp(0.95rem, 2vw, 1.05rem)" }}>Join Tripchain and start tracking your journeys.</p>

        <GoogleAuthButton
          label="Sign up with Google"
          disabled={loading}
          onCredential={handleGoogleSignup}
          onError={(message) => setMsg(message)}
        />
        <div className="auth-divider"><span>OR</span></div>

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
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="email"
                placeholder="your@domain.com"
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

            {msg && <div className="info-text" style={{ color: isError ? '#EF4444' : '#10B981', background: isError ? "#FEF2F2" : "#D1FAE5", padding: "12px", borderRadius: "12px", border: `3px solid ${isError ? "#FCA5A5" : "#6EE7B7"}`, fontWeight: "bold" }}>{msg}</div>}

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
