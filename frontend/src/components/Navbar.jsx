import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, PlusCircle, BarChart2, Trophy, User, Map, LogIn, UserPlus, LogOut, Menu, X } from "lucide-react";
import "../styles/navbar.css";

const Navbar = () => {
  const token = localStorage.getItem("tripchain_token");
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

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
        className="navbar"
        initial={{ y: -80, x: "-50%" }}
        animate={{ y: 0, x: "-50%" }}
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
            <Link to="/" style={{display: "flex", alignItems: "center", gap: "6px"}}><LayoutDashboard size={18} /> Dashboard</Link>
            <Link to="/add-trip" style={{display: "flex", alignItems: "center", gap: "6px"}}><PlusCircle size={18} /> Add Trip</Link>
            <Link to="/insights" style={{display: "flex", alignItems: "center", gap: "6px"}}><BarChart2 size={18} /> Insights</Link>
            <Link to="/achievements" style={{display: "flex", alignItems: "center", gap: "6px"}}><Trophy size={18} /> Achievements</Link>
            <Link to="/profile" style={{display: "flex", alignItems: "center", gap: "6px"}}><User size={18} /> Profile</Link>
            <Link to="/planner" style={{display: "flex", alignItems: "center", gap: "6px"}}><Map size={18} /> Route Planner</Link>
          </nav>
        )}

        {/* DESKTOP RIGHT SIDE */}
        <div className="navbar-right desktop-only">
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
              <Link to="/" onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><LayoutDashboard size={24} /> Dashboard</Link>
              <Link to="/add-trip" onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><PlusCircle size={24} /> Add Trip</Link>
              <Link to="/insights" onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><BarChart2 size={24} /> Insights</Link>
              <Link to="/achievements" onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><Trophy size={24} /> Achievements</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><User size={24} /> Profile</Link>
              <Link to="/planner" onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "10px"}}><Map size={24} /> Route Planner</Link>

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
