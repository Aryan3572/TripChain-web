import prisma from "../config/prisma.js";
import { getCache, setCache } from "../config/redis.js";

export const getEcoScore = async (req, res) => {
  try {
    const userId = req.userId;
    const cacheKey = `cache:ecoscore:${userId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const trips = await prisma.trip.findMany({ where: { userId } });

    if (!trips.length) {
      const emptyData = { success: true, message: "No trips found", ecoScore: 0 };
      return res.status(200).json(emptyData);
    }

    const totalCO2 = trips.reduce((s, t) => s + (t.co2 || 0), 0);
    const totalDist = trips.reduce((s, t) => s + (t.distance || 0), 0);
    const avgCO2PerKm = totalCO2 / (totalDist || 1);

    const modeCount = trips.reduce((acc, t) => {
      acc[t.mode] = (acc[t.mode] || 0) + 1;
      return acc;
    }, {});

    const carTrips = modeCount["Car"] || 0;
    const bikeTrips = modeCount["Bike"] || 0;

    let ecoScore = 100 - ((avgCO2PerKm * 10) + (carTrips * 2) + (bikeTrips * 1));
    ecoScore = Math.min(Math.max(Math.round(ecoScore), 0), 100);

    const responseData = {
      success: true,
      message: "Eco Score calculated successfully",
      ecoScore,
      breakdown: {
        avgCO2PerKm: Number(avgCO2PerKm.toFixed(2)),
        totalTrips: trips.length,
        carTrips,
        bikeTrips,
      },
    };

    await setCache(cacheKey, responseData, 300);
    res.status(200).json(responseData);
  } catch (err) {
    console.error("Error calculating eco score:", err);
    res.status(500).json({ success: false, message: "Server error calculating eco score" });
  }
};
