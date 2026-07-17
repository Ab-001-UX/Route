import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { nameSchema, relationshipSchema, phoneSchema } from "../lib/validators";
import { generateToken, hashToken } from "../lib/tokens";

// 7 days in milliseconds
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns active, pending, and unresponsive contacts for the authenticated user.
 * Excludes removed contacts.
 */
export const getContacts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.neq(q.field("status"), "removed"))
      .collect();
  },
});

/**
 * Adds a new contact for the authenticated user in "pending" state.
 * Generates and returns a plaintext invite token (not stored in DB).
 */
export const addContact = mutation({
  args: {
    name: v.string(),
    relationship: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User record not found");
    }

    // Input Validation
    const parsedName = nameSchema.safeParse(args.name);
    const parsedRelationship = relationshipSchema.safeParse(args.relationship);
    const parsedPhone = phoneSchema.safeParse(args.phone);

    if (!parsedName.success) throw new ConvexError(parsedName.error.issues[0].message);
    if (!parsedRelationship.success) throw new ConvexError(parsedRelationship.error.issues[0].message);
    if (!parsedPhone.success) throw new ConvexError(parsedPhone.error.issues[0].message);

    // Cryptographic token generation
    const plaintextToken = generateToken();
    const tokenHash = await hashToken(plaintextToken);
    const expiresAt = Date.now() + INVITE_EXPIRY_MS;

    await ctx.db.insert("contacts", {
      userId: user._id,
      name: parsedName.data,
      relationship: parsedRelationship.data,
      phone: parsedPhone.data,
      email: args.email || undefined,
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: expiresAt,
      status: "pending",
      missedCheckIns: 0,
      responseRate: 0,
      avgResponseTime: 0,
      createdAt: Date.now(),
    });

    return { token: plaintextToken };
  },
});

/**
 * Transition a contact status to "removed".
 * This immediately and permanently revokes their access to safety details.
 */
export const removeContact = mutation({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User record not found");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) {
      throw new ConvexError("Contact not found or unauthorized");
    }

    await ctx.db.patch(contact._id, {
      status: "removed",
    });

    return { success: true };
  },
});

/**
 * Regenerate invite token for a pending contact.
 * Returns the new plaintext invite token.
 */
export const resendInvite = mutation({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User record not found");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) {
      throw new ConvexError("Contact not found or unauthorized");
    }

    await ctx.db.insert("dataAccessLogs", {
      userId: identity.subject,
      action: "read_contact_phone",
      resourceType: "contacts",
      resourceId: args.contactId,
      timestamp: Date.now(),
    });

    const plaintextToken = generateToken();
    const tokenHash = await hashToken(plaintextToken);
    const expiresAt = Date.now() + INVITE_EXPIRY_MS;

    await ctx.db.patch(contact._id, {
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: expiresAt,
      status: "pending", // Reset back to pending if they had failed/expired
    });

    return { token: plaintextToken };
  },
});

/**
 * PUBLIC MUTATION: Activates a contact via their invite link.
 * Matches hashed token, validates expiry, and saves encrypted FCM push token.
 */
export const activateContact = mutation({
  args: {
    token: v.string(),
    encryptedFcmToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate hash to lookup
    const hashed = await hashToken(args.token);
    
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_inviteTokenHash", (q) => q.eq("inviteTokenHash", hashed))
      .unique();

    if (!contact || contact.status === "removed" || contact.inviteTokenExpiresAt < Date.now()) {
      return { success: false };
    }

    await ctx.db.patch(contact._id, {
      status: "active",
      encryptedFcmToken: args.encryptedFcmToken || contact.encryptedFcmToken,
    });

    return { success: true };
  },
});
