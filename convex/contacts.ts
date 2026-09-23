import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Deprecated in Route v2 — Emergency contacts features removed for simplicity.
 */
export const getContacts = query({
  args: {},
  handler: async () => {
    return [];
  },
});

export const addContact = mutation({
  args: {
    name: v.string(),
    relationship: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
  },
  handler: async () => {
    return { token: "deprecated" };
  },
});

export const removeContact = mutation({
  args: {
    contactId: v.string(),
  },
  handler: async () => {
    return { success: true };
  },
});

export const resendInvite = mutation({
  args: {
    contactId: v.string(),
  },
  handler: async () => {
    return { token: "deprecated" };
  },
});

export const activateContact = mutation({
  args: {
    token: v.string(),
    encryptedFcmToken: v.optional(v.string()),
  },
  handler: async () => {
    return { success: false };
  },
});
