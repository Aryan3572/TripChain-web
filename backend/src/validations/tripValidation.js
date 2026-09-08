// src/validations/tripValidation.js
import { z } from "zod";

export const tripSchema = z.object({
  from: z.string().min(2, "Origin is required"),
  to: z.string().min(2, "Destination is required"),

  mode: z
    .string()
    .transform((val) => {
      const lower = val.toLowerCase();
      if (lower === "cycling") return "bike";
      if (lower === "walking") return "walk";
      if (lower === "rail") return "train";
      return lower;
    })
    .refine(
      (val) => ["car", "bus", "train", "walk", "bike", "cab", "scooter", "transit", "carpool"].includes(val),
      { message: "Invalid mode" }
    ),

  distance: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Distance must be positive" }),

  duration: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Duration must be positive" }),

  date: z.string().datetime("Invalid date format"),

  routeType: z
    .enum(["fastest", "eco"])
    .optional()
    .default("fastest"),

  co2Saved: z
    .union([z.number(), z.string()])
    .transform((val) => Math.max(0, Number(val) || 0))
    .optional()
    .default(0),

  points: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val) || 0)
    .optional(),
});
