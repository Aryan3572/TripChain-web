import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Zap, Leaf, Save, AlertCircle, Car, Bike, Footprints, Bus, Train, Users } from "lucide-react";
import mapboxgl from "mapbox-gl";
import mbxDirections from "@mapbox/mapbox-sdk/services/directions";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import { apiRequest } from "../api/api";
import NotificationModal from "../components/NotificationModal";

import "../styles/animations.css";
import "../theme/light.css";
import "../theme/medium.css";
import "../theme/strong.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

function RoutePlanner() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const mapLoaded = useRef(false);

  const [currentPos, setCurrentPos] = useState(null);
  const [destination, setDestination] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [mode, setMode] = useState("driving");
  const [ecoInfo, setEcoInfo] = useState(null);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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

  // DRAW ROUTE
  function drawRoute(id, data, color) {
    const map = mapRef.current;

    if (!mapLoaded.current) return;

    if (map.getSource(id)) {
      map.removeLayer(id);
      map.removeSource(id);
    }

    map.addSource(id, {
      type: "geojson",
      data,
    });

    map.addLayer({
      id,
      type: "line",
      source: id,
      paint: {
        "line-width": 6,
        "line-color": color,
      },
      layout: { "line-cap": "round", "line-join": "round" },
    });
  }

  // PLAN ROUTE
  async function planRoute(e) {
    e.preventDefault();
    setError("");
    setRouteInfo(null);
    setEcoInfo(null);

    if (!destination.trim()) {
      setError("Enter destination");
      return;
    }
    if (!currentPos) {
      setError("Finding your location...");
      return;
    }

    try {
      const geo = await geocodingClient
        .forwardGeocode({ query: destination, limit: 1 })
        .send();

      if (!geo.body.features.length) {
        setError("Destination not found");
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

      const fastest = routes[0];
      const eco = [...routes].sort((a, b) => a.distance - b.distance)[0];

      drawRoute("fastest", fastest.geometry, "#3A86FF");
      drawRoute("eco", eco.geometry, "#10B981");

      setRouteInfo({
        km: (fastest.distance / 1000).toFixed(2),
        min: Math.round(fastest.duration / 60),
      });

      if (eco && eco.distance < fastest.distance) {
        setEcoInfo({
          km: (eco.distance / 1000).toFixed(2),
          min: Math.round(eco.duration / 60),
        });
      }
    } catch (err) {
      console.error(err);
      setError("Could not calculate route");
    }
  }

  // SAVE TRIP
  async function saveTrip() {
    if (!routeInfo) return alert("Plan a route first");

    let mappedMode = "car";
    if (mode === "cycling") mappedMode = "bike";
    if (mode === "walking") mappedMode = "walk";
    if (mode === "transit" || mode === "train") mappedMode = "transit";
    if (mode === "carpool") mappedMode = "carpool";

    const body = {
      from: "My Location",
      to: destination,
      mode: mappedMode,
      distance: Number(routeInfo.km),
      duration: Number(routeInfo.min),
      date: new Date().toISOString(),
    };

    try {
      await apiRequest("/api/trips", "POST", body);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message || "Failed to save trip");
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

  return (
    <motion.div 
      style={{ display: "flex", gap: "40px", flexDirection: isMobile ? "column" : "row", maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
    >
      <motion.div 
        style={{ flex: 1, padding: "40px", background: "#FFFFFF", borderRadius: "24px", border: "4px solid #14213D", boxShadow: "8px 8px 0px #14213D", display: "flex", flexDirection: "column" }} 
        variants={itemVariants}
      >
        <h1 style={{fontSize: "2.2rem", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px", color: "#14213D"}}>
          <Navigation size={36} color="#3A86FF" /> Plan Your Trip
        </h1>

        <form onSubmit={planRoute} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
          
          <div style={{display: 'flex', gap: '16px'}}>
            <motion.button 
              whileHover={{ y: -4 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('driving')}
              style={{flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'driving' ? "#3A86FF" : "#FFFFFF", color: mode === 'driving' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'driving' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s"}}
            >
              <Car size={32} />
              Driving
            </motion.button>
            <motion.button 
              whileHover={{ y: -4 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('cycling')}
              style={{flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'cycling' ? "#FF006E" : "#FFFFFF", color: mode === 'cycling' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'cycling' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s"}}
            >
              <Bike size={32} />
              Cycling
            </motion.button>
            <motion.button 
              whileHover={{ y: -4 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('walking')}
              style={{flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'walking' ? "#FFBE0B" : "#FFFFFF", color: mode === 'walking' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'walking' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s"}}
            >
              <Footprints size={32} />
              Walking
            </motion.button>
          </div>

          <div style={{display: 'flex', gap: '16px'}}>
            <motion.button 
              whileHover={{ y: -4 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('transit')}
              style={{flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'transit' ? "#8338EC" : "#FFFFFF", color: mode === 'transit' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'transit' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s"}}
            >
              <Bus size={32} />
              Transit
            </motion.button>
            <motion.button 
              whileHover={{ y: -4 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('train')}
              style={{flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'train' ? "#FF5400" : "#FFFFFF", color: mode === 'train' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'train' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s"}}
            >
              <Train size={32} />
              Rail
            </motion.button>
            <motion.button 
              whileHover={{ y: -4 }} whileTap={{ y: 2 }}
              type="button" 
              onClick={() => setMode('carpool')}
              style={{flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: "16px", border: "3px solid #14213D", background: mode === 'carpool' ? "#38B000" : "#FFFFFF", color: mode === 'carpool' ? "#FFFFFF" : "#14213D", boxShadow: mode === 'carpool' ? "4px 4px 0px #14213D" : "2px 2px 0px #14213D", transition: "all 0.2s"}}
            >
              <Users size={32} />
              Carpool
            </motion.button>
          </div>

          <motion.button 
            whileHover={{ y: -4 }} whileTap={{ y: 2 }}
            type="submit"
            style={{width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", padding: "16px", fontSize: "1.2rem", fontWeight: "bold", borderRadius: "16px", background: "#10B981", color: "#FFFFFF", border: "3px solid #14213D", boxShadow: "4px 4px 0px #14213D"}}
          >
            <Navigation size={22} /> Show Route
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{opacity: 0, scale: 0.9, height: 0}} 
              animate={{opacity: 1, scale: 1, height: "auto"}} 
              exit={{opacity: 0, scale: 0.9, height: 0}}
              style={{ color: '#EF4444', background: "#FEF2F2", padding: "16px", borderRadius: "16px", border: "3px solid #FCA5A5", fontWeight: "bold", marginTop: "24px", display: "flex", alignItems: "center", gap: "10px" }}
            >
              <AlertCircle size={20} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {routeInfo && (
            <motion.div 
              initial={{opacity: 0, scale: 0.9, y: 20}} 
              animate={{opacity: 1, scale: 1, y: 0}} 
              exit={{opacity: 0, scale: 0.9, y: 20}}
              style={{
                marginTop: "24px", 
                padding: "20px", 
                background: "#F8FAFC", 
                border: "3px solid #14213D", 
                borderRadius: "16px", 
                boxShadow: "4px 4px 0px #14213D"
              }}
            >
              <h3 style={{display: "flex", alignItems: "center", gap: "8px", color: "#3A86FF", marginBottom: "8px", fontSize: "1.2rem"}}>
                <Zap size={24} /> Fastest Route
              </h3>
              <p style={{fontWeight: "800", fontSize: "1.4rem", color: "#14213D"}}>{routeInfo.km} km <span style={{color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: "600"}}>in {routeInfo.min} min</span></p>
            </motion.div>
          )}

          {ecoInfo && (
            <motion.div 
              initial={{opacity: 0, scale: 0.9, y: 20}} 
              animate={{opacity: 1, scale: 1, y: 0}} 
              exit={{opacity: 0, scale: 0.9, y: 20}}
              style={{
                marginTop: "16px", 
                padding: "20px", 
                background: "#D1FAE5", 
                border: "3px solid #14213D", 
                borderRadius: "16px", 
                boxShadow: "4px 4px 0px #14213D"
              }}
            >
              <h3 style={{display: "flex", alignItems: "center", gap: "8px", color: "#059669", marginBottom: "8px", fontSize: "1.2rem"}}>
                <Leaf size={24} /> Eco Route
              </h3>
              <p style={{fontWeight: "800", fontSize: "1.4rem", color: "#14213D"}}>{ecoInfo.km} km <span style={{color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: "600"}}>in {ecoInfo.min} min</span></p>
            </motion.div>
          )}
        </AnimatePresence>

        {routeInfo && (
          <motion.button 
            initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
            whileHover={{ y: -4 }} whileTap={{ y: 2 }}
            onClick={saveTrip} 
            style={{marginTop: "24px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", padding: "16px", fontSize: "1.2rem", fontWeight: "bold", borderRadius: "16px", background: "#3A86FF", color: "#FFFFFF", border: "3px solid #14213D", boxShadow: "4px 4px 0px #14213D"}}
          >
            <Save size={22} /> Save Trip
          </motion.button>
        )}
      </motion.div>

      <motion.div
        variants={itemVariants}
        ref={containerRef}
        style={{
          flex: 1.5,
          minHeight: "600px",
          width: "100%",
          borderRadius: "24px",
          border: "4px solid #14213D",
          boxShadow: "8px 8px 0px #14213D",
          overflow: "hidden",
        }}
      />

      <NotificationModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        message="Your trip has been successfully saved!" 
      />
    </motion.div>
  );
}

export default RoutePlanner;
