import React, { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { initThemeEngine } from "./theme/themeEngine";

import Navbar from "./components/Navbar";
import FloatingElements from "./components/FloatingElements";
import ActiveTripBanner from "./components/ActiveTripBanner";
import { Web3Provider } from "./context/Web3Context";

import "./styles/animations.css";
import "./theme/light.css";
import "./theme/medium.css";
import "./theme/strong.css";
import "./index.css";

// Lazy-load pages for maximum performance and instant first-paint
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RoutePlanner = lazy(() => import("./pages/RoutePlanner"));
const LiveTracker = lazy(() => import("./pages/LiveTracker"));
const Insights = lazy(() => import("./pages/Insights"));
const AddTrip = lazy(() => import("./pages/AddTrip"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Web3Rewards = lazy(() => import("./pages/Web3Rewards"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

const isMobile = () => window.innerWidth <= 700;

// High performance minimal loading indicator
const PageLoader = () => (
  <div style={{
    minHeight: "50vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "14px",
  }}>
    <div style={{
      width: "42px",
      height: "42px",
      border: "4px solid #14213D",
      borderTopColor: "#3A86FF",
      borderRadius: "50%",
      animation: "spin 0.6s linear infinite",
    }} />
    <span style={{ fontWeight: "800", color: "#14213D", fontSize: "0.9rem" }}>
      Loading Tripchain...
    </span>
  </div>
);

// 🔥 Wrapper component to handle mobile redirect safely
function MobileRedirectWrapper({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("tripchain_token");

    const onAuthPage =
      location.pathname === "/login" || location.pathname === "/signup";

    // Redirect only if mobile + user not logged in + not already on login/signup
    if (isMobile() && !token && !onAuthPage) {
      navigate("/login", { replace: true });
    }
  }, [location, navigate]);

  return children;
}

function MainLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <MobileRedirectWrapper>
      <FloatingElements />
      <Navbar />
      <ActiveTripBanner />

      <div className={`app-container ${isAuthPage ? "app-container-auth" : ""}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/planner" element={<RoutePlanner />} />
            <Route path="/track" element={<LiveTracker />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/add-trip" element={<AddTrip />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/rewards" element={<Web3Rewards />} />
            <Route path="/profile" element={<Profile />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </Suspense>
      </div>
    </MobileRedirectWrapper>
  );
}

function App() {
  useEffect(() => {
    initThemeEngine();
  }, []);

  return (
    <BrowserRouter>
      <Web3Provider>
        <MainLayout />
      </Web3Provider>
    </BrowserRouter>
  );
}

export default App;
