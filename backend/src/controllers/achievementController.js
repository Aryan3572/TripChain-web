import prisma from "../config/prisma.js";

/**
 * Core function to evaluate user achievements and award newly earned badges.
 * Returns { ecoScore, allBadges, newlyAwarded }
 */
export const checkAndAwardBadges = async (userId) => {
  const trips = await prisma.trip.findMany({ where: { userId } });
  if (!trips.length) {
    return { ecoScore: 0, allBadges: [], newlyAwarded: [] };
  }

  // Count trips by mode
  const modeCount = trips.reduce((acc, t) => {
    const m = (t.mode || "").toLowerCase();
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});

  // Eco route statistics
  const ecoRouteTrips = trips.filter((t) => t.routeType === "eco");
  const totalCO2Saved = trips.reduce((s, t) => s + (t.co2Saved || 0), 0);

  // Compute eco score
  const totalCO2 = trips.reduce((s, t) => s + (t.co2 || 0), 0);
  const totalDist = trips.reduce((s, t) => s + (t.distance || 0), 0);
  const avgCO2PerKm = totalCO2 / (totalDist || 1);
  
  // Base eco score with bonus for choosing eco routes
  let ecoScore = 100 - (avgCO2PerKm * 10) + (ecoRouteTrips.length * 3);
  ecoScore = Math.min(Math.max(Math.round(ecoScore), 0), 100);

  // Define eligible badges
  const eligibleBadges = [];

  // 1. Eco Pathfinder - First Eco Route selected
  if (ecoRouteTrips.length >= 1) {
    eligibleBadges.push({
      name: "Eco Pathfinder",
      description: "Chose an Eco Route to save fuel and cut emissions",
      icon: "leaf",
    });
  }

  // 2. Green Commuter - 5+ Eco Routes selected
  if (ecoRouteTrips.length >= 5) {
    eligibleBadges.push({
      name: "Green Commuter",
      description: "Completed 5 or more eco-friendly optimized routes",
      icon: "leaf",
    });
  }

  // 3. Carbon Crusader - Saved 2+ kg of CO2
  if (totalCO2Saved >= 2.0) {
    eligibleBadges.push({
      name: "Carbon Crusader",
      description: `Saved over ${totalCO2Saved.toFixed(1)} kg of CO₂ through smart route choices`,
      icon: "shield",
    });
  }

  // 4. Eco Traveler - High overall eco score
  if (ecoScore >= 80) {
    eligibleBadges.push({
      name: "Eco Traveler",
      description: "Maintains a low carbon footprint across all journeys",
      icon: "globe",
    });
  }

  // 5. Active Commuter - 10+ walking / cycling trips
  const activeTrips = (modeCount["walk"] || 0) + (modeCount["bike"] || 0);
  if (activeTrips >= 10) {
    eligibleBadges.push({
      name: "Active Commuter",
      description: "Completed 10+ walking or cycling trips",
      icon: "footprints",
    });
  }

  // 6. Public Transport Hero - 5+ public transit trips
  const publicTransportTrips =
    (modeCount["bus"] || 0) + (modeCount["train"] || 0) + (modeCount["transit"] || 0);
  if (publicTransportTrips >= 5) {
    eligibleBadges.push({
      name: "Public Transport Hero",
      description: "Uses public transport frequently",
      icon: "bus",
    });
  }

  // 7. Balanced Traveler - 3+ distinct modes
  const distinctModes = Object.keys(modeCount).length;
  if (distinctModes >= 3) {
    eligibleBadges.push({
      name: "Balanced Traveler",
      description: "Uses diverse modes of travel",
      icon: "car",
    });
  }

  // 8. Trip Master - 50+ total trips
  if (trips.length >= 50) {
    eligibleBadges.push({
      name: "Trip Master",
      description: "Logged 50 or more trips",
      icon: "award",
    });
  }

  // Award new badges in the DB
  const newlyAwarded = [];
  for (const badge of eligibleBadges) {
    const existing = await prisma.userBadge.findFirst({
      where: { userId, name: badge.name },
    });
    if (!existing) {
      const created = await prisma.userBadge.create({
        data: {
          userId,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        },
      });
      newlyAwarded.push(created);
    }
  }

  // Fetch all current badges for the user
  const allBadges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { achievedAt: "desc" },
  });

  return { ecoScore, allBadges, newlyAwarded };
};

export const evaluateAchievements = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const { ecoScore, allBadges, newlyAwarded } = await checkAndAwardBadges(userId);

    res.status(200).json({
      success: true,
      message: "Achievements evaluated successfully",
      ecoScore,
      earnedCount: allBadges.length,
      badges: allBadges,
      newlyAwarded,
    });
  } catch (err) {
    console.error("Error evaluating achievements:", err);
    res.status(500).json({ success: false, message: "Server error evaluating achievements" });
  }
};
