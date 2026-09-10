// src/validations/authValidation.js
import { z } from "zod";
import { BLOCKED_DOMAINS } from "../utils/emailValidator.js";

const strictEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please provide a valid email format.")
  .refine((val) => {
    const parts = val.split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1];
    if (BLOCKED_DOMAINS.has(domain)) return false;
    const domainParts = domain.split(".");
    return domainParts.length >= 2 && domainParts[domainParts.length - 1].length >= 2;
  }, {
    message: "Email address must have a valid domain and cannot be a dummy domain (such as example.com).",
  });

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: strictEmailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: strictEmailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const googleCredentialSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});
