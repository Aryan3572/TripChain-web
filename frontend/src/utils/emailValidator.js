// Shared email validation utility for frontend forms
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const BLOCKED_DOMAINS = [
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "fake.com",
  "dummy.com",
  "tempmail.com",
  "mailinator.com",
  "10minutemail.com",
  "throwawaymail.com",
  "guerrillamail.com",
  "trashmail.com"
];

export const validateEmailAddress = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== "string") {
    return { valid: false, message: "Email address is required." };
  }

  const email = rawEmail.trim().toLowerCase();

  if (email.length < 5 || email.length > 254) {
    return { valid: false, message: "Email length must be between 5 and 254 characters." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: "Please enter a valid email address (e.g. name@domain.com)." };
  }

  const atParts = email.split("@");
  if (atParts.length !== 2) {
    return { valid: false, message: "Email address must contain exactly one '@'." };
  }

  const [localPart, domain] = atParts;
  if (!localPart || localPart.length > 64) {
    return { valid: false, message: "Invalid email username part." };
  }

  if (!domain || domain.length > 255) {
    return { valid: false, message: "Invalid email domain part." };
  }

  if (BLOCKED_DOMAINS.includes(domain)) {
    return { 
      valid: false, 
      message: `Emails with '@${domain}' are dummy/reserved domains. Please use a real active email address.` 
    };
  }

  const domainParts = domain.split(".");
  if (domainParts.length < 2) {
    return { valid: false, message: "Email must include a valid domain extension (e.g. .com, .org)." };
  }

  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]{2,}$/.test(tld)) {
    return { valid: false, message: "Email domain must end with a valid extension of at least 2 letters (e.g. .com, .in)." };
  }

  return { valid: true, normalizedEmail: email };
};
