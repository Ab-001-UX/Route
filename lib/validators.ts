import { z } from "zod";

// Helper to strip HTML tags
const stripHtml = (val: unknown): string => {
  if (typeof val !== "string") return "";
  return val.replace(/<\/?[^>]+(>|$)/g, "");
};

// Helper to strip non-alphanumeric, non-space and non-dash characters
const sanitizePlate = (val: unknown): string => {
  if (typeof val !== "string") return "";
  return val.replace(/[^a-zA-Z0-9 -]/g, "").toUpperCase();
};

/**
 * Normalizes any Nigerian phone number format (local, international, or digit-only)
 * to standard +234XXXXXXXXXX format.
 */
export const normalizeNigerianPhoneNumber = (val: unknown): string => {
  if (typeof val !== "string") return "";
  
  // Strip all non-digit characters
  let clean = val.replace(/\D/g, "");
  
  // If clean starts with "00234", strip it
  if (clean.startsWith("00234")) {
    clean = clean.slice(5);
  }
  // Else if clean starts with "234", strip it
  else if (clean.startsWith("234")) {
    clean = clean.slice(3);
  }
  
  // If it starts with "0", strip it (handles local 080... or leftover 2340...)
  if (clean.startsWith("0")) {
    clean = clean.slice(1);
  }
  
  // Now we should have the 10-digit national number starting with 7, 8, or 9
  if (clean.length === 10 && /^[789]/.test(clean)) {
    return `+234${clean}`;
  }
  
  // If it's already +234XXXXXXXXXX, return the clean standard format
  if (val.startsWith("+234") && val.replace(/\D/g, "").length === 13) {
    return `+${val.replace(/\D/g, "")}`;
  }
  
  // Otherwise return standard cleaned value or original so that regex check fails correctly
  return val;
};

/**
 * Validates Nigerian phone numbers in +234XXXXXXXXXX format.
 * (Mobile numbers starting with 70, 80, 81, 90, 91, etc.)
 */
export const phoneSchema = z.preprocess(
  (val) => normalizeNigerianPhoneNumber(val),
  z.string().regex(/^\+234[789]\d{9}$/, {
    message: "Invalid Nigerian phone number format. Must start with +234 followed by 10 digits.",
  })
);

/**
 * Validates display name (optional, max 100 chars, stripped of HTML).
 */
export const displayNameSchema = z.preprocess(
  stripHtml,
  z.string().max(100, { message: "Display name cannot exceed 100 characters." })
);

/**
 * Validates contact name (required, max 100 chars, stripped of HTML).
 */
export const nameSchema = z.preprocess(
  stripHtml,
  z
    .string()
    .min(1, { message: "Name is required." })
    .max(100, { message: "Name cannot exceed 100 characters." })
);

/**
 * Validates relationship label (required, max 100 chars, stripped of HTML).
 */
export const relationshipSchema = z.preprocess(
  stripHtml,
  z
    .string()
    .min(1, { message: "Relationship is required." })
    .max(100, { message: "Relationship cannot exceed 100 characters." })
);

/**
 * Validates description (optional, max 300 chars, stripped of HTML).
 */
export const descriptionSchema = z.preprocess(
  stripHtml,
  z.string().max(300, { message: "Description cannot exceed 300 characters." })
);

/**
 * Validates vehicle plates (required, max 15 chars, alphanumeric and spaces only, uppercase).
 */
export const plateSchema = z.preprocess(
  sanitizePlate,
  z
    .string()
    .min(1, { message: "Plate number is required." })
    .max(15, { message: "Plate number cannot exceed 15 characters." })
);

/**
 * Validates incident type / category (max 100 chars, stripped of HTML).
 */
export const incidentTypeSchema = z.preprocess(
  stripHtml,
  z
    .string()
    .min(1, { message: "Incident type is required." })
    .max(100, { message: "Incident description cannot exceed 100 characters." })
);

/**
 * Validates user theme selection (light or dark).
 */
export const themeSchema = z.enum(["light", "dark"], {
  errorMap: () => ({ message: "Theme must be light or dark." }),
});

/**
 * Validates user font size scaling selection.
 */
export const fontSizeSchema = z.enum(["default", "large", "extra-large"], {
  errorMap: () => ({ message: "Font size must be default, large, or extra-large." }),
});

/**
 * Validates privacy mode boolean.
 */
export const privacyModeSchema = z.boolean();

/**
 * Strips all carriage return and newline characters to prevent log injection.
 */
export const sanitizeLog = (val: unknown): string => {
  if (val === undefined || val === null) return "";
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  return str.replace(/[\r\n]+/g, " ");
};

