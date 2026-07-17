import posthog from "posthog-js";

/**
 * Initializes PostHog analytics client-side if environment variables are set.
 * Gracefully degrades if variables are missing or running server-side.
 */
export function initAnalytics() {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Running in development mode. PostHog client is disabled; events will be logged to console.");
    return;
  }

  if (!key) {
    return;
  }

  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only", // Avoid merging anonymous profiles unnecessarily
    advanced_disable_decide: true, // Route does not use feature flags — disable /decide polling to prevent network noise
    loaded: (ph) => {
      // Custom loaded callback if needed
    },
  });
}

/**
 * Tracks a custom event in PostHog, strictly enforcing PII removal.
 * Checks for sensitive patterns and filters them out.
 */
export function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  // Clone properties to prevent mutating original object
  const cleanProperties = { ...properties };

  // Strict audit: Remove any potential personal identifiable information (PII)
  const piiKeys = [
    "phone", "phoneNumber", "email", "name", "displayName", "fullName", 
    "lat", "lng", "latitude", "longitude", "coords", "coordinates", 
    "plate", "plateNumber", "location", "boardingLocation", "address"
  ];

  for (const key of piiKeys) {
    if (key in cleanProperties) {
      // Rather than printing/logging, we strip PII to preserve compliance
      delete cleanProperties[key];
    }
  }

  // Check string values for potential phone numbers (e.g., Nigerian formats like +234 or 080)
  for (const [key, val] of Object.entries(cleanProperties)) {
    if (typeof val === "string") {
      const nigerianPhoneRegex = /(?:\+?234|0)[789]\d{9}/g;
      if (nigerianPhoneRegex.test(val)) {
        cleanProperties[key] = "[REDACTED PHONE]";
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics Mock] Tracked Event "${eventName}":`, cleanProperties);
    return;
  }

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(eventName, cleanProperties);
}

/**
 * Associates subsequent events with an anonymized unique user identifier.
 * Uses SHA-256 or simple hashing if necessary, or a non-PII provider identifier.
 */
export function identifyUser(clerkUserId: string) {
  if (typeof window === "undefined" || !clerkUserId) return;

  // To prevent passing Clerk ID directly if we want maximum anonymization,
  // we can create a fast non-reversible hash.
  const hash = clerkUserId.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0) | 0;
  }, 0);

  const anonId = `anon_${Math.abs(hash)}`;

  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics Mock] Identified User: ${anonId}`);
    return;
  }

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.identify(anonId);
}

/**
 * Resets the active analytics session.
 */
export function resetAnalytics() {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics Mock] Reset Session");
    return;
  }

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.reset();
}
