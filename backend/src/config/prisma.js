// src/config/prisma.js
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Force load and override any stale terminal env variables with our .env
dotenv.config({ override: true });

const prisma = new PrismaClient({
  log: ["warn", "error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
