"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Deprecated in Route v2 — background safety check actions removed for simplicity.
 */
export const triggerSafetyCheck = action({
  args: {
    tripId: v.id("trips"),
    plaintextToken: v.string(),
  },
  handler: async () => {},
});

export const triggerSafetyCheckRetry = action({
  args: {
    tripId: v.id("trips"),
    plaintextToken: v.string(),
    attempt: v.number(),
  },
  handler: async () => {},
});
