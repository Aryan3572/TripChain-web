import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Plane, Leaf } from "lucide-react";

const FloatingElements = ({ themeColor = "#3A86FF" }) => {
  const [spawnedElements, setSpawnedElements] = useState([]);

  useEffect(() => {
    // Prevents text selection when spam-clicking the background
    const handleMousedown = (e) => {
      // If clicking directly on empty background (not on text or cards), prevent default
      if (!e.target.closest('button, a, input, form, .glass-card, .navbar, .auth-card, .sidebar, .nav-item, .logo-text, p, h1, h2, h3, h4, h5, h6, span, li')) {
        e.preventDefault(); 
      }
    };

    const handleClick = (e) => {
      // Prevent spawning if clicking on an interactive element, card, or navbar
      if (e.target.closest('button, a, input, form, .glass-card, .navbar, .auth-card, .sidebar, .nav-item, .logo-text')) return;

      const id = Date.now() + Math.random();
      const rand = Math.random();
      const type = rand < 0.2 ? 'plane' : rand < 0.6 ? 'cloud' : 'leaf';
      const size = Math.random() * 40 + 30;

      const newElement = {
        id,
        x: e.clientX,
        y: e.clientY,
        type,
        size
      };

      setSpawnedElements(prev => [...prev, newElement]);

      // Remove after animation finishes
      setTimeout(() => {
        setSpawnedElements(prev => prev.filter(el => el.id !== id));
      }, 12000); 
    };

    window.addEventListener('mousedown', handleMousedown);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('mousedown', handleMousedown);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  const elements = React.useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => {
      const isCloud = i % 2 === 0;
      const isPlane = i % 5 === 0;
      const size = Math.random() * 40 + 30;
      const duration = Math.random() * 25 + 15;
      const delay = Math.random() * -20; // negative delay so they start already on screen
      const startY = Math.random() * 90;
      
      return (
        <motion.div
          key={i}
          initial={{ x: "-15vw", y: `${startY}vh` }}
          animate={{ x: "110vw", y: `${startY + (Math.random() * 20 - 10)}vh` }}
          transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", zIndex: 0, opacity: Math.random() * 0.4 + 0.1 }}
        >
          {isPlane ? <Plane size={size} color={themeColor} /> : (isCloud ? <Cloud size={size * 1.5} color={themeColor} /> : <Leaf size={size * 0.8} color="#FFBE0B" />)}
        </motion.div>
      );
    });
  }, [themeColor]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {elements}
      
      <AnimatePresence>
        {spawnedElements.map(el => (
          <motion.div
            key={el.id}
            initial={{ scale: 0, opacity: 0, x: 0, y: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: Math.random() * 0.5 + 0.4, x: "100vw", y: (Math.random() * -300) - 100, rotate: 10 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 12, 
              ease: "linear",
              scale: { duration: 0.6, type: "spring", bounce: 0.6 },
              opacity: { duration: 0.4 },
              rotate: { duration: 12, ease: "linear" }
            }}
            style={{ 
              position: "absolute", 
              left: el.x, 
              top: el.y, 
              zIndex: 1,
              transform: "translate(-50%, -50%)"
            }}
          >
            {el.type === 'plane' ? <Plane size={el.size} color={themeColor} /> : 
             el.type === 'cloud' ? <Cloud size={el.size * 1.5} color={themeColor} /> : 
             <Leaf size={el.size * 0.8} color="#FFBE0B" />}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingElements;
