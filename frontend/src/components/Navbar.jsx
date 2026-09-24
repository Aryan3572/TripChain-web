import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, PlusCircle, BarChart2, Trophy, User, Map, LogIn, UserPlus, LogOut, Menu, X, Coins, Wallet, Sparkles } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import "../styles/navbar.css";

const Navbar = () => {
  const token = localStorage.getItem("tripchain_token");
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const { isConnected, tripBalance, connectWallet, connectDemoWallet, isDemoMode } = useWeb3();

  const handleLogout = () => {
    localStorage.removeItem("tripchain_token");
    localStorage.removeItem("tripchain_userEmail");
    navigate("/login");
  };

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {/* TOP NAVBAR */}
      <motion.header 
        className={`navbar ${isAuthPage ? "navbar-auth" : ""}`}
        initial={{ y: -80, x: isAuthPage && window.innerWidth <= 768 ? "0%" : "-50%" }}
        animate={{ y: 0, x: isAuthPage && window.innerWidth <= 768 ? "0%" : "-50%" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="navbar-left">
          <span
            className="logo-text"
            onClick={() => (token ? navigate("/") : navigate("/login"))}
          >
            Trip<span>chain</span>
          </span>
        </div>

        {/* DESKTOP NAV LINKS */}
        {!isAuthPage && (
          <nav className="navbar-links desktop-only">
            <Link to="/" className={location.pathname === "/" ? "active" : ""} style={{display: "flex", alignItems: "center", gap: "5px"}}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link to="/planner" className={location.pathname === "/planner" ? "active" : ""} style={{display: "flex", alignItems: "center", gap: "5px"}}>
              <Map size={16} /> Planner
            </Link>
            <Link to="/track" className={location.pathname === "/track" ? "active" : ""} style={{display: "flex", alignItems: "center", gap: "5px", position: "relative"}}>
              <span style={{width: "7px", height: "7px", borderRadius: "50%", background: "#00F5D4", boxShadow: "0 0 8px #00F5D4", display: "inline-block"}}></span>
              Tracker
            </Link>
            <Link to="/add-trip" className={location.pathname === "/add-trip" ? "active" : ""} style={{display: "flex", alignItems: "center", gap: "5px"}}>
              <PlusCircle size={16} /> Add Trip
            </Link>
            <Link to="/insights" className={location.pathname === "/insights" ? "active" : ""} style={{display: "flex", alignItems: "center", gap: "5px"}}>
              <BarChart2 size={16} /> Insights
            </Link>
            <Link to="/achievements" className={location.pathname === "/achievements" ? "active" : ""} style={{display: "flex", alignItems: "center", gap: "5px"}}>
              <Trophy size={16} /> Badges
            </Link>
            {!isConnected && (
              <Link to="/rewards" className={`nav-trip-pill ${location.pathname === "/rewards" ? "active" : ""}`} style={{display: "flex", alignItems: "center", gap: "5px"}}>
                <Coins size={15} color="#D97706" /> $TRIP
              </Link>
            )}
            <Link to="/profile" className={location.pathname === "/profile" ? "active" : ""} style={{display: "flex", alignItems: "center", gap: "5px"}}>
              <User size={16} /> Profile
            </Link>
          </nav>
        )}

        {/* DESKTOP RIGHT SIDE */}
        <div className="navbar-right desktop-only" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {token && (
            isConnected ? (
              <Link to="/rewards" className="nav-wallet-pill">
                <Coins size={14} color="#D97706" /> {tripBalance} $TRIP
                {isDemoMode && (
                  <span style={{ fontSize: "0.68rem", background: "#E0E7FF", color: "#4338CA", padding: "1px 5px", borderRadius: "6px", fontWeight: "800" }}>
                    DEMO
                  </span>
                )}
              </Link>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={connectWallet}
                  className="nav-connect-btn"
                  title="Connect Web3 Wallet (MetaMask)"
                >
                  <Wallet size={14} /> Connect Wallet
                </button>
                <button
                  onClick={connectDemoWallet}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 8px",
                    borderRadius: "10px",
                    border: "2px solid #14213D",
                    background: "#FEF08A",
                    color: "#854D0E",
                    cursor: "pointer",
                    boxShadow: "2px 2px 0px #14213D",
                    transition: "all 0.15s ease",
                  }}
                  title="Switch to Demo Sandbox Mode (150 $TRIP test tokens)"
                  aria-label="Demo Sandbox Mode"
                >
                  <Sparkles size={14} color="#854D0E" />
                </button>
              </div>
            )
          )}

          {!token ? (
            <>
              <Link to="/login" className="btn-outline" style={{display: "flex", alignItems: "center", gap: "6px"}}><LogIn size={18} /> Log in</Link>
              <Link to="/signup" className="btn-primary" style={{display: "flex", alignItems: "center", gap: "6px"}}><UserPlus size={18} /> Sign up</Link>
            </>
          ) : (
            <button className="btn-outline" onClick={handleLogout} style={{display: "flex", alignItems: "center", gap: "6px"}}>
              <LogOut size={18} /> Logout
            </button>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        {!isAuthPage && (
          <button
            className="hamburger mobile-only"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={28} />
          </button>
        )}
      </motion.header>

      {/* MOBILE OVERLAY MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            className="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button className="close-btn" onClick={() => setMenuOpen(false)}>
              <X size={32} />
            </button>

            <nav className="mobile-nav-links">
              <Link to="/" className={location.pathname === "/" ? "active" : ""} onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><LayoutDashboard size={24} /> Dashboard</Link>
              <Link to="/planner" className={location.pathname === "/planner" ? "active" : ""} onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><Map size={24} /> Route Planner</Link>
              <Link to="/track" className={location.pathname === "/track" ? "active" : ""} onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}>
                <span style={{width: "10px", height: "10px", borderRadius: "50%", background: "#00F5D4", boxShadow: "0 0 10px #00F5D4", display: "inline-block"}}></span>
                Live Tracker
              </Link>
              <Link to="/add-trip" className={location.pathname === "/add-trip" ? "active" : ""} onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><PlusCircle size={24} /> Add Trip</Link>
              <Link to="/insights" className={location.pathname === "/insights" ? "active" : ""} onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><BarChart2 size={24} /> Insights</Link>
              <Link to="/achievements" className={location.pathname === "/achievements" ? "active" : ""} onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><Trophy size={24} /> Achievements</Link>
              <Link to="/rewards" className={location.pathname === "/rewards" ? "active" : ""} onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><Coins size={24} color="#F59E0B" /> $TRIP Rewards</Link>
              <Link to="/profile" className={location.pathname === "/profile" ? "active" : ""} onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><User size={24} /> Profile</Link>

              {!token ? (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline mobile-btn" style={{display: "flex", justifyContent: "center", alignItems: "center", gap: "10px"}}><LogIn size={20} /> Log in</Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn-primary mobile-btn" style={{display: "flex", justifyContent: "center", alignItems: "center", gap: "10px"}}><UserPlus size={20} /> Sign up</Link>
                </>
              ) : (
                <button className="btn-outline mobile-btn" onClick={handleLogout} style={{display: "flex", justifyContent: "center", alignItems: "center", gap: "10px"}}>
                  <LogOut size={20} /> Logout
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
