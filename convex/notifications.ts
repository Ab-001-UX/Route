import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Deprecated in Route v2 — push notifications removed for simplicity.
 */
export const getNotifications = query({
  args: {},
  handler: async () => {
    return [];
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async () => {
    return { success: true };
  },
});

export const clearNotification = mutation({
  args: { id: v.string() },
  handler: async () => {
    return { success: true };
  },
});
