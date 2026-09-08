// src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import {
  googleCredentialSchema,
  loginSchema,
  registerSchema,
} from "../validations/authValidation.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const createAuthToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

// ✅ Register new real users
export const registerUser = async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const { name, email, password } = parsed;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    const { password: _, ...safeUser } = user;
    res.status(201).json({ message: "User registered successfully", user: safeUser });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(400).json({ message: err?.errors || err.message });
  }
};

// ✅ Login existing users
export const loginUser = async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { email, password } = parsed;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = createAuthToken(user.id);

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(400).json({ message: err?.errors || err.message });
  }
};

// Verifies a Google OpenID Connect ID token before using any identity fields from it.
export const loginWithGoogle = async (req, res) => {
  try {
    const { credential } = googleCredentialSchema.parse(req.body);

    if (!GOOGLE_CLIENT_ID) {
      console.error("Google sign-in is not configured: GOOGLE_CLIENT_ID is missing");
      return res.status(503).json({ message: "Google sign-in is not configured" });
    }

    const verificationResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!verificationResponse.ok) {
      return res.status(401).json({ message: "Invalid Google credential" });
    }

    const payload = await verificationResponse.json();
    const acceptedIssuers = ["accounts.google.com", "https://accounts.google.com"];

    if (
      !payload?.sub ||
      !payload.email ||
      payload.aud !== GOOGLE_CLIENT_ID ||
      !acceptedIssuers.includes(payload.iss) ||
      payload.email_verified !== "true"
    ) {
      return res.status(401).json({ message: "Google account email could not be verified" });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name?.trim() || email.split("@")[0];

    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      const userWithEmail = await prisma.user.findUnique({ where: { email } });

      if (userWithEmail?.password) {
        return res.status(409).json({
          code: "ACCOUNT_LINKING_REQUIRED",
          message:
            "An account with this email already exists. Please sign in with your email and password; Google cannot be linked automatically.",
        });
      }

      user = userWithEmail
        ? await prisma.user.update({ where: { id: userWithEmail.id }, data: { googleId } })
        : await prisma.user.create({ data: { name, email, password: null, googleId } });
    }

    const token = createAuthToken(user.id);
    return res.json({
      message: "Google login successful",
      token,
      user: { email: user.email },
    });
  } catch (err) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ message: err.errors });
    }

    // Verification failures must not disclose credential contents or provider internals.
    console.error("Google login failed:", err?.message);
    return res.status(401).json({ message: "Invalid Google credential" });
  }
};

// ✅ Get profile of the logged-in user
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
