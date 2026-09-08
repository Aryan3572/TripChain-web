// src/utils/metrics.js

export function estimateTripMetrics(mode, distanceKm) {
  const costRates = {
    car: 5,
    bus: 2,
    train: 1.5,
    walk: 0,
    bike: 0,
    cab: 12,
    scooter: 1.5,
    transit: 2,
    carpool: 2.5,
  };

  const co2Rates = {
    car: 0.192,
    bus: 0.089,
    train: 0.041,
    walk: 0,
    bike: 0,
    cab: 0.192,
    scooter: 0.05,
    transit: 0.065,
    carpool: 0.096,
  };

  const normalizedMode = mode?.toLowerCase() || "car";
  const costRate = costRates[normalizedMode] ?? 5;
  const co2Rate = co2Rates[normalizedMode] ?? 0.192;

  const cost = Number((costRate * distanceKm).toFixed(2));
  const co2 = Number((co2Rate * distanceKm).toFixed(3));

  return { cost, co2 };
}

export function calculateTripRewards(routeType, mode, distanceKm, userCo2Saved = 0) {
  const isEco = routeType === "eco";
  let co2Saved = Number(userCo2Saved) || 0;

  if (isEco && co2Saved <= 0) {
    // If co2Saved wasn't calculated by alternatives comparison, estimate average 15% saving
    const { co2 } = estimateTripMetrics(mode, distanceKm);
    co2Saved = Number((co2 * 0.15).toFixed(3));
  }

  let points = isEco ? 50 : 10;

  // Bonus points for zero-emission travel
  const normalizedMode = mode?.toLowerCase();
  if (normalizedMode === "walk" || normalizedMode === "bike") {
    points += 20;
  } else if (normalizedMode === "transit" || normalizedMode === "train" || normalizedMode === "bus") {
    points += 10;
  }

  // Bonus for significant carbon savings (+5 pts per 0.1 kg saved)
  if (co2Saved > 0) {
    points += Math.round(co2Saved * 50);
  }

  return {
    points,
    co2Saved: Number(co2Saved.toFixed(3)),
    isEco,
  };
}

