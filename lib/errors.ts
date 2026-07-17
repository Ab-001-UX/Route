import * as Sentry from "@sentry/nextjs";

/**
 * Reports an exception/error to Sentry, strictly auditing and scrubbing PII details.
 */
export function reportError(error: unknown, extraContext: Record<string, any> = {}) {
  // Convert non-error objects to Error where applicable
  const errorObject = error instanceof Error ? error : new Error(String(error));

  const cleanContext = { ...extraContext };

  // Scrub potential personal data (PII) keys
  const piiKeys = [
    "phone", "phoneNumber", "email", "name", "displayName", "fullName", 
    "lat", "lng", "latitude", "longitude", "coords", "coordinates", 
    "plate", "plateNumber", "location", "boardingLocation", "address"
  ];

  for (const key of piiKeys) {
    if (key in cleanContext) {
      delete cleanContext[key];
    }
  }

  // Redact values matching phone numbers
  for (const [key, val] of Object.entries(cleanContext)) {
    if (typeof val === "string") {
      const nigerianPhoneRegex = /(?:\+?234|0)[789]\d{9}/g;
      if (nigerianPhoneRegex.test(val)) {
        cleanContext[key] = "[REDACTED PHONE]";
      }
    }
  }

  // Capture exception with Sentry scope context
  Sentry.withScope((scope) => {
    scope.setExtras(cleanContext);
    Sentry.captureException(errorObject);
  });

  // Log locally during development
  if (process.env.NODE_ENV === "development") {
    console.error("[Errors Hub] Error reported to Sentry:", errorObject, cleanContext);
  }
}
