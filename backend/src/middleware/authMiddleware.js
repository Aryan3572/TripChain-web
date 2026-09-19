// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../controllers/authController.js";

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.userId = decoded.userId; // 👈 this is what we use in controllers
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

