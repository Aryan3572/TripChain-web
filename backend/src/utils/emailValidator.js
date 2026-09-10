// backend/src/utils/emailValidator.js
import dns from "node:dns";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "fake.com",
  "dummy.com",
  "invalid.com",
  "tempmail.com",
  "mailinator.com",
  "10minutemail.com",
  "throwawaymail.com",
  "guerrillamail.com",
  "trashmail.com",
  "dispostable.com"
]);

/**
 * Validates email format, verifies domain structure, blocks dummy domains,
 * and performs DNS mail server (MX) verification.
 */
export async function validateEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== "string") {
    return { valid: false, message: "Email is required." };
  }

  const email = rawEmail.trim().toLowerCase();

  if (email.length < 5 || email.length > 254) {
    return { valid: false, message: "Email length must be between 5 and 254 characters." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: "Please provide a valid email format (e.g., name@domain.com)." };
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return { valid: false, message: "Email must contain exactly one '@'." };
  }

  const [localPart, domain] = parts;
  if (!localPart || localPart.length > 64) {
    return { valid: false, message: "Email user part is invalid or too long." };
  }

  if (!domain || domain.length > 255) {
    return { valid: false, message: "Email domain is invalid or too long." };
  }

  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      valid: false,
      message: `Emails with domain '@${domain}' are dummy or reserved addresses. Please use a real email address.`
    };
  }

  const domainParts = domain.split(".");
  if (domainParts.length < 2) {
    return { valid: false, message: "Email domain must include a valid top-level domain." };
  }

  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]{2,}$/.test(tld)) {
    return { valid: false, message: "Email domain extension is invalid." };
  }

  // Asynchronous DNS MX check with a 2-second timeout
  try {
    const checkMx = dns.promises.resolveMx(domain);
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), 2000)
    );

    const mxRecords = await Promise.race([checkMx, timeout]);

    if (!mxRecords || mxRecords.length === 0) {
      // Fallback: check if domain has an A record (fallback mail server)
      const aRecords = await dns.promises.resolve4(domain).catch(() => []);
      if (!aRecords || aRecords.length === 0) {
        return {
          valid: false,
          message: `The domain '@${domain}' does not appear to have active mail servers.`
        };
      }
    }
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      return {
        valid: false,
        message: `The email domain '@${domain}' does not exist.`
      };
    }
    // For DNS_TIMEOUT or other network issues, fail open to avoid blocking genuine users
    console.warn(`[Email Validation] DNS check for '${domain}' skipped (${err.message}).`);
  }

  return { valid: true, normalizedEmail: email };
}
