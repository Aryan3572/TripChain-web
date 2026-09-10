import prisma from "../config/prisma.js";
import { clearUserCache } from "../config/redis.js";

/**
 * DELETE /api/trips/all
 * Deletes all trips belonging to the authenticated user
 */
export const deleteAllTrips = async (req, res) => {
  try {
    const userId = req.userId;

    const deleted = await prisma.trip.deleteMany({
      where: { userId },
    });

    // ⚡ Invalidate cached dashboard and eco-score for this user
    clearUserCache(userId).catch((cacheErr) => {
      console.warn("Could not clear user cache on trip deletion:", cacheErr.message);
    });

    res.status(200).json({
      success: true,
      message: `${deleted.count} trips deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting all trips:", err);
    res.status(500).json({
      success: false,
      message: "Server error deleting trips",
    });
  }
};
