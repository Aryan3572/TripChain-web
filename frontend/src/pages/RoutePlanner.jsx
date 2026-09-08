import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Navigation, Zap, Leaf, AlertCircle, 
  Car, Bike, Footprints, Bus, Train, Users, CheckCircle2, Sparkles
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import mbxDirections from "@mapbox/mapbox-sdk/services/directions";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import { apiRequest } from "../api/api";
import RouteRewardModal from "../components/RouteRewardModal";

import "../styles/animations.css";
import "../theme/light.css";
import "../theme/medium.css";
import "../theme/strong.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const MODE_CO2_RATES = {
  driving: 0.192,
  car: 0.192,
  cycling: 0,
  bike: 0,
  walking: 0,
  walk: 0,
  transit: 0.065,
  train: 0.041,
  carpool: 0.096,
};

function RoutePlanner() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const mapLoaded = useRef(false);

  const [currentPos, setCurrentPos] = useState(null);
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState("driving");
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [savingTrip, setSavingTrip] = useState(false);

  const [routeInfo, setRouteInfo] = useState(null); // Fastest route
  const [ecoInfo, setEcoInfo] = useState(null);     // Eco route
  const [selectedRouteType, setSelectedRouteType] = useState("eco"); // "eco" | "fastest"

  const [error, setError] = useState("");
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  const directionsClient = mbxDirections({ accessToken: mapboxgl.accessToken });
  const geocodingClient = mbxGeocoding({ accessToken: mapboxgl.accessToken });

  // Handle Resize for responsive flex direction
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // INIT MAP
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [72.8777, 19.076],
      zoom: 12,
    });

    map.on("load", () => {
      mapLoaded.current = true;
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      mapLoaded.current = false;
    };
  }, []);

  // GET USER LOCATION
  useEffect(() => {
    let isMounted = true;
    let locationInterval;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMounted) return;
        const coords = {
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        };
        setCurrentPos(coords);

        locationInterval = setInterval(() => {
          if (!isMounted) {
            clearInterval(locationInterval);
            return;
          }
          if (mapLoaded.current && mapRef.current) {
            try {
              new mapboxgl.Marker().setLngLat([coords.lng, coords.lat]).addTo(mapRef.current);
              mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 14 });
            } catch (err) {
              console.warn("Failed to add marker, map may be removed:", err);
            }
            clearInterval(locationInterval);
          }
        }, 100);
      },
      () => {
        if (isMounted) setError("Enable location permissions.");
      }
    );

    return () => {
      isMounted = false;
      if (locationInterval) clearInterval(locationInterval);
    };
  }, []);

  // RENDER / UPDATE ROUTES ON MAP
  const updateMapRoutes = (fastestGeom, ecoGeom, activeType) => {
    const map = mapRef.current;
    if (!mapLoaded.current || !map) return;

    // Draw / update Fastest Route layer
    if (fastestGeom) {
      if (map.getSource("fastest")) {
        map.getSource("fastest").setData(fastestGeom);
      } else {
        map.addSource("fastest", { type: "geojson", data: fastestGeom });
        map.addLayer({
          id: "fastest",
          type: "line",
          source: "fastest",
          paint: {
            "line-width": activeType === "fastest" ? 8 : 4,
            "line-color": activeType === "fastest" ? "#3A86FF" : "#93C5FD",
            "line-opacity": activeType === "fastest" ? 1.0 : 0.5,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
      }
      if (map.getLayer("fastest")) {
        map.setPaintProperty("fastest", "line-width", activeType === "fastest" ? 8 : 4);
        map.setPaintProperty("fastest", "line-color", activeType === "fastest" ? "#3A86FF" : "#93C5FD");
        map.setPaintProperty("fastest", "line-opacity", activeType === "fastest" ? 1.0 : 0.5);
      }
    }

    // Draw / update Eco Route layer
    if (ecoGeom) {
      if (map.getSource("eco")) {
        map.getSource("eco").setData(ecoGeom);
      } else {
        map.addSource("eco", { type: "geojson", data: ecoGeom });
        map.addLayer({
          id: "eco",
          type: "line",
          source: "eco",
          paint: {
            "line-width": activeType === "eco" ? 8 : 4,
            "line-color": activeType === "eco" ? "#10B981" : "#A7F3D0",
            "line-opacity": activeType === "eco" ? 1.0 : 0.5,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
      }
      if (map.getLayer("eco")) {
        map.setPaintProperty("eco", "line-width", activeType === "eco" ? 8 : 4);
        map.setPaintProperty("eco", "line-color", activeType === "eco" ? "#10B981" : "#A7F3D0");
        map.setPaintProperty("eco", "line-opacity", activeType === "eco" ? 1.0 : 0.5);
      }
    }
  };

  // Re-highlight map layers when selected route type changes
  useEffect(() => {
    if (routeInfo && ecoInfo) {
      updateMapRoutes(routeInfo.geometry, ecoInfo.geometry, selectedRouteType);
    }
  }, [selectedRouteType, routeInfo, ecoInfo]);

  // PLAN ROUTE
  async function planRoute(e) {
    e.preventDefault();
    setError("");
    setRouteInfo(null);
    setEcoInfo(null);
    setLoadingRoute(true);

    if (!destination.trim()) {
      setError("Enter destination");
      setLoadingRoute(false);
      return;
    }
    if (!currentPos) {
      setError("Finding your location... Please ensure GPS/location permission is enabled.");
      setLoadingRoute(false);
      return;
    }

    try {
      const geo = await geocodingClient
        .forwardGeocode({ query: destination, limit: 1 })
        .send();

      if (!geo.body.features.length) {
        setError("Destination not found. Please try another search term.");
        setLoadingRoute(false);
        return;
      }

      const [lng, lat] = geo.body.features[0].center;
      
      let mapboxProfile = mode;
      if (mode === "transit" || mode === "train" || mode === "carpool") mapboxProfile = "driving";

      const dir = await directionsClient
        .getDirections({
          profile: mapboxProfile,
          geometries: "geojson",
          alternatives: true,
          waypoints: [
            { coordinates: [currentPos.lng, currentPos.lat] },
            { coordinates: [lng, lat] },
          ],
        })
        .send();

      const routes = dir.body.routes;
      if (!routes || routes.length === 0) {
        setError("No driving/walking route available between these locations.");
        setLoadingRoute(false);
        return;
      }

      // 1. Fastest Route (lowest duration)
      const fastest = [...routes].sort((a, b) => a.duration - b.duration)[0];
      
      // 2. Eco Route (lowest distance / fuel consumption)
      let ecoCandidate = routes.length > 1 
        ? [...routes].sort((a, b) => a.distance - b.distance)[0]
        : null;

      // If eco candidate is identical to fastest but an alternative route exists, choose alternative
      if (ecoCandidate && ecoCandidate.distance >= fastest.distance && routes.length > 1) {
        ecoCandidate = routes.find((r) => r !== fastest) || ecoCandidate;
      }

      const co2Rate = MODE_CO2_RATES[mode] ?? 0.192;
      const fastestKM = Number((fastest.distance / 1000).toFixed(2));
      const fastestMin = Math.round(fastest.duration / 60);
      const fastestCO2 = Number((co2Rate * fastestKM).toFixed(3));

      let ecoKM, ecoMin, ecoCO2, ecoGeometry;

      if (ecoCandidate && (ecoCandidate.distance < fastest.distance || ecoCandidate.duration !== fastest.duration)) {
        ecoKM = Number((ecoCandidate.distance / 1000).toFixed(2));
        ecoMin = Math.round(ecoCandidate.duration / 60);
        ecoCO2 = Number((co2Rate * ecoKM).toFixed(3));
        ecoGeometry = ecoCandidate.geometry;
      } else {
        // Single route or same distance: simulate Eco-Driving route (smooth cruising, ~15% CO2 reduction)
        ecoKM = fastestKM;
        ecoMin = Math.max(fastestMin + 2, Math.round(fastestMin * 1.06));
        ecoCO2 = Number((fastestCO2 * 0.85).toFixed(3));
        ecoGeometry = fastest.geometry;
      }

      const calculatedCO2Saved = Math.max(0.02, Number((fastestCO2 - ecoCO2).toFixed(3)));

      setRouteInfo({
        km: fastestKM,
        min: fastestMin,
        co2: fastestCO2,
        geometry: fastest.geometry,
      });

      setEcoInfo({
        km: ecoKM,
        min: ecoMin,
        co2: ecoCO2,
        co2Saved: calculatedCO2Saved,
        geometry: ecoGeometry,
      });

      // Default to Eco Route to reward sustainable travel
      setSelectedRouteType("eco");

      // Draw routes on map
      updateMapRoutes(fastest.geometry, ecoGeometry, "eco");

      // Fit map bounds to view both coordinates
      if (mapRef.current) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([currentPos.lng, currentPos.lat]);
        bounds.extend([lng, lat]);
        mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });
      }

    } catch (err) {
      console.error(err);
      setError("Could not calculate route: " + (err.message || "Unknown error"));
    }

    setLoadingRoute(false);
  }

  // SAVE TRIP
  async function saveTrip() {
    const isEco = selectedRouteType === "eco";
    const activeRoute = isEco ? ecoInfo : routeInfo;

    if (!activeRoute) return alert("Please calculate a route first");

    setSavingTrip(true);
    setError("");

    let mappedMode = "car";
    if (mode === "cycling") mappedMode = "bike";
    if (mode === "walking") mappedMode = "walk";
    if (mode === "transit") mappedMode = "transit";
    if (mode === "train") mappedMode = "train";
    if (mode === "carpool") mappedMode = "carpool";

    const body = {
      from: "My Location",
      to: destination,
      mode: mappedMode,
      distance: Number(activeRoute.km),
      duration: Number(activeRoute.min),
      routeType: selectedRouteType,
      co2Saved: isEco ? Number(ecoInfo?.co2Saved || 0) : 0,
      date: new Date().toISOString(),
    };

    try {
      const res = await apiRequest("/api/trips", "POST", body);

      const rewards = res?.rewards || {
        isEco,
        pointsEarned: isEco ? 50 : 10,
        co2Saved: isEco ? Number(ecoInfo?.co2Saved || 0) : 0,
        newBadges: [],
      };

      setRewardData(rewards);
      setShowRewardModal(true);
    } catch (err) {
      setError(err.message || "Failed to save trip");
    } finally {
      setSavingTrip(false);
    }
  }

  // ANIMATION VARS
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.5 } }
  };

  const isEcoSelected = selectedRouteType === "eco";

  return (
    <motion.div 
      style={{ display: "flex", gap: "36px", flexDirection: isMobile ? "column" : "row", maxWidth: "1280px", margin: "0 auto", paddingBottom: "40px" }}
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
    >
      <motion.div 
        style={{ flex: 1, padding: "36px", background: "#FFFFFF", borderRadius: "24px", border: "4px solid #14213D", boxShadow: "8px 8px 0px #14213D", display: "flex", flexDirection: "column" }} 
        variants={itemVariants}
      >
        <h1 style={{fontSize: "2.2rem", marginBottom: "28px", display: "flex", alignItems: "center", gap: "12px", color: "#14213D"}}>
          <Navigation size={36} color="#3A86FF" /> Plan Your Trip
        </h1>

        <form onSubmit={planRoute} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "bold", color: "#14213D", fontSize: "15px" }}>
            Destination
            <div style={{ position: "relative" }}>
              <MapPin size={20} color="var(--text-muted)" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
              <input
                type="text"
                required
                placeholder="Where do you want to go?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px", border: "3px solid #14213D", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "inset 0px 4px 0px rgba(0,0,0,0.04)" }}
                onFocus={(e) => { e.target.style.borderColor = "#3A86FF"; e.target.style.background = "#FFFFFF"; }}
                onBlur={(e) => { e.target.style.borderColor = "#14213D"; e.target.style.background = "#F8FAFC"; }}
              />
            </div>
          </label>
          
          {/* Mode Selector */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <motion.button 
              whileHover={{ y: -3 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('driving')}
              style={{ padding: '14px', fontSize: '14px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'driving' ? "#3A86FF" : "#FFFFFF", color: mode === 'driving' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'driving' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s" }}
            >
              <Car size={26} /> Driving
            </motion.button>
            <motion.button 
              whileHover={{ y: -3 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('cycling')}
              style={{ padding: '14px', fontSize: '14px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'cycling' ? "#FF006E" : "#FFFFFF", color: mode === 'cycling' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'cycling' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s" }}
            >
              <Bike size={26} /> Cycling
            </motion.button>
            <motion.button 
              whileHover={{ y: -3 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('walking')}
              style={{ padding: '14px', fontSize: '14px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'walking' ? "#FFBE0B" : "#FFFFFF", color: mode === 'walking' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'walking' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s" }}
            >
              <Footprints size={26} /> Walking
            </motion.button>
            <motion.button 
              whileHover={{ y: -3 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('transit')}
              style={{ padding: '14px', fontSize: '14px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'transit' ? "#8338EC" : "#FFFFFF", color: mode === 'transit' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'transit' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s" }}
            >
              <Bus size={26} /> Transit
            </motion.button>
            <motion.button 
              whileHover={{ y: -3 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('train')}
              style={{ padding: '14px', fontSize: '14px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'train' ? "#FF5400" : "#FFFFFF", color: mode === 'train' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'train' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s" }}
            >
              <Train size={26} /> Rail
            </motion.button>
            <motion.button 
              whileHover={{ y: -3 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('carpool')}
              style={{ padding: '14px', fontSize: '14px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'carpool' ? "#38B000" : "#FFFFFF", color: mode === 'carpool' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'carpool' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s" }}
            >
              <Users size={26} /> Carpool
            </motion.button>
          </div>

          <motion.button 
            whileHover={{ y: -4 }} whileTap={{ y: 2 }}
            type="submit"
            disabled={loadingRoute}
            style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", padding: "16px", fontSize: "1.2rem", fontWeight: "bold", borderRadius: "16px", background: "#10B981", color: "#FFFFFF", border: "3px solid #14213D", boxShadow: "4px 4px 0px #14213D", cursor: "pointer" }}
          >
            <Navigation size={22} /> {loadingRoute ? "Calculating Routes..." : "Show Routes"}
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{opacity: 0, scale: 0.9, height: 0}} 
              animate={{opacity: 1, scale: 1, height: "auto"}} 
              exit={{opacity: 0, scale: 0.9, height: 0}}
              style={{ color: '#EF4444', background: "#FEF2F2", padding: "16px", borderRadius: "16px", border: "3px solid #FCA5A5", fontWeight: "bold", marginTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}
            >
              <AlertCircle size={20} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ROUTE COMPARISON & SELECTION SECTION */}
        <AnimatePresence>
          {routeInfo && ecoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "1rem", fontWeight: "800", color: "#14213D" }}>Select Route Option:</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>Click a card to choose</span>
              </div>

              {/* 1. ECO ROUTE CARD */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRouteType("eco")}
                style={{
                  padding: "18px 20px",
                  background: isEcoSelected ? "#D1FAE5" : "#F8FAFC",
                  border: isEcoSelected ? "3px solid #059669" : "3px solid #14213D",
                  borderRadius: "18px",
                  boxShadow: isEcoSelected ? "6px 6px 0px #059669" : "4px 4px 0px #14213D",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: "800", fontSize: "1.2rem" }}>
                    <Leaf size={22} /> Eco Route
                    <span style={{ background: "#10B981", color: "#FFFFFF", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                      RECOMMENDED
                    </span>
                  </div>
                  {isEcoSelected ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#059669", fontWeight: "800", fontSize: "0.9rem" }}>
                      <CheckCircle2 size={20} /> Selected
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "700" }}>Click to select</span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                  <p style={{ fontWeight: "800", fontSize: "1.4rem", color: "#14213D", margin: 0 }}>
                    {ecoInfo.km} km <span style={{ color: "var(--text-muted)", fontSize: "1.05rem", fontWeight: "600" }}>in {ecoInfo.min} min</span>
                  </p>
                  <span style={{ color: "#059669", fontWeight: "700", fontSize: "0.95rem" }}>
                    ~{ecoInfo.co2} kg CO₂
                  </span>
                </div>

                {/* Eco Rewards Callout */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: isEcoSelected ? "#FFFFFF" : "#E2E8F0", padding: "6px 12px", borderRadius: "10px", marginTop: "4px", fontSize: "0.85rem", fontWeight: "700", color: "#047857" }}>
                  <Sparkles size={16} /> Earn +50 Eco Points & save ~{ecoInfo.co2Saved} kg CO₂!
                </div>
              </motion.div>

              {/* 2. FASTEST ROUTE CARD */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRouteType("fastest")}
                style={{
                  padding: "18px 20px",
                  background: !isEcoSelected ? "#DBEAFE" : "#F8FAFC",
                  border: !isEcoSelected ? "3px solid #2563EB" : "3px solid #14213D",
                  borderRadius: "18px",
                  boxShadow: !isEcoSelected ? "6px 6px 0px #2563EB" : "4px 4px 0px #14213D",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3A86FF", fontWeight: "800", fontSize: "1.2rem" }}>
                    <Zap size={22} /> Fastest Route
                  </div>
                  {!isEcoSelected ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#2563EB", fontWeight: "800", fontSize: "0.9rem" }}>
                      <CheckCircle2 size={20} /> Selected
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "700" }}>Click to select</span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                  <p style={{ fontWeight: "800", fontSize: "1.4rem", color: "#14213D", margin: 0 }}>
                    {routeInfo.km} km <span style={{ color: "var(--text-muted)", fontSize: "1.05rem", fontWeight: "600" }}>in {routeInfo.min} min</span>
                  </p>
                  <span style={{ color: "#64748b", fontWeight: "700", fontSize: "0.95rem" }}>
                    ~{routeInfo.co2} kg CO₂
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: !isEcoSelected ? "#FFFFFF" : "#E2E8F0", padding: "6px 12px", borderRadius: "10px", marginTop: "4px", fontSize: "0.85rem", fontWeight: "700", color: "#1E40AF" }}>
                  <Zap size={16} /> Earn +10 Standard Points
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SAVE BUTTON */}
        {routeInfo && (
          <motion.button 
            initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
            whileHover={{ y: -4 }} whileTap={{ y: 2 }}
            disabled={savingTrip}
            onClick={saveTrip} 
            style={{
              marginTop: "24px", 
              width: "100%", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              gap: "10px", 
              padding: "16px", 
              fontSize: "1.2rem", 
              fontWeight: "bold", 
              borderRadius: "16px", 
              background: isEcoSelected ? "#10B981" : "#3A86FF", 
              color: "#FFFFFF", 
              border: "3px solid #14213D", 
              boxShadow: "4px 4px 0px #14213D",
              cursor: "pointer",
            }}
          >
            {isEcoSelected ? <Leaf size={22} /> : <Zap size={22} />}
            {savingTrip 
              ? "Saving & Calculating Rewards..." 
              : isEcoSelected 
                ? "Save Eco Trip (+50 Points)" 
                : "Save Fastest Trip (+10 Points)"}
          </motion.button>
        )}
      </motion.div>

      {/* MAP VIEW CONTAINER */}
      <motion.div
        variants={itemVariants}
        ref={containerRef}
        style={{
          flex: 1.5,
          minHeight: "650px",
          width: "100%",
          borderRadius: "24px",
          border: "4px solid #14213D",
          boxShadow: "8px 8px 0px #14213D",
          overflow: "hidden",
        }}
      />

      {/* REWARD CELEBRATION MODAL */}
      <RouteRewardModal 
        isOpen={showRewardModal} 
        onClose={() => setShowRewardModal(false)} 
        rewardData={rewardData}
      />
    </motion.div>
  );
}

export default RoutePlanner;
