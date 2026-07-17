import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { phoneSchema, displayNameSchema, themeSchema, fontSizeSchema, privacyModeSchema } from "../lib/validators";


/**
 * Returns the currently authenticated user's database record.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

/**
 * Creates a user record in the database upon successful Clerk login.
 * If the record already exists, returns the existing ID.
 */
export const createUser = mutation({
  args: {
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      return existing._id;
    }

    // Validate phone number
    const parsedPhone = phoneSchema.safeParse(args.phone);
    if (!parsedPhone.success) {
      throw new ConvexError(parsedPhone.error.issues[0].message);
    }

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      phone: parsedPhone.data,
      contributorStatus: false,
      tripCountToday: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Updates the user's profile details (e.g. displayName during onboarding).
 */
export const updateUser = mutation({
  args: {
    displayName: v.optional(v.string()),
    phone: v.optional(v.string()),
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
      throw new ConvexError("User not found");
    }

    const patches: { displayName?: string; phone?: string } = {};

    if (args.displayName !== undefined) {
      const parsedName = displayNameSchema.safeParse(args.displayName);
      if (!parsedName.success) {
        throw new ConvexError(parsedName.error.issues[0].message);
      }
      patches.displayName = parsedName.data || undefined;
    }

    if (args.phone !== undefined) {
      const parsedPhone = phoneSchema.safeParse(args.phone);
      if (!parsedPhone.success) {
        throw new ConvexError(parsedPhone.error.issues[0].message);
      }
      patches.phone = parsedPhone.data;
    }

    await ctx.db.patch(user._id, patches);

    return user._id;
  },
});

/**
 * Updates the user's settings (theme, font size, privacy mode).
 */
export const updateUserSettings = mutation({
  args: {
    theme: v.optional(v.string()),
    fontSize: v.optional(v.string()),
    privacyMode: v.optional(v.boolean()),
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

    const updates: {
      theme?: string;
      fontSize?: string;
      privacyMode?: boolean;
    } = {};

    if (args.theme !== undefined) {
      const parsedTheme = themeSchema.safeParse(args.theme);
      if (!parsedTheme.success) {
        throw new ConvexError(parsedTheme.error.issues[0].message);
      }
      updates.theme = parsedTheme.data;
    }

    if (args.fontSize !== undefined) {
      const parsedFontSize = fontSizeSchema.safeParse(args.fontSize);
      if (!parsedFontSize.success) {
        throw new ConvexError(parsedFontSize.error.issues[0].message);
      }
      updates.fontSize = parsedFontSize.data;
    }

    if (args.privacyMode !== undefined) {
      const parsedPrivacyMode = privacyModeSchema.safeParse(args.privacyMode);
      if (!parsedPrivacyMode.success) {
        throw new ConvexError(parsedPrivacyMode.error.issues[0].message);
      }
      updates.privacyMode = parsedPrivacyMode.data;
    }

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

/**
 * Unlocks the contributor status (unlimited trips) for the user.
 */
export const becomeContributor = mutation({
  args: {
    amount: v.number(),
    type: v.union(v.literal("voluntary"), v.literal("monthly-tier")),
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

    // Insert record in contributions table
    await ctx.db.insert("contributions", {
      userId: user._id,
      amount: args.amount,
      type: args.type,
      tierUnlocked: args.type === "monthly-tier" || args.amount >= 1000,
      createdAt: Date.now(),
    });

    // If monthly tier unlocked or voluntary contribution >= 1000, upgrade status
    if (args.type === "monthly-tier" || args.amount >= 1000) {
      await ctx.db.patch(user._id, {
        contributorStatus: true,
      });
    }

    return { success: true, contributorStatus: true };
  },
});

/**
 * Developer mutation to purge all database records for fresh onboarding testing.
 */
export const purgeDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const adminClerkId = process.env.ADMIN_CLERK_ID;
    if (!adminClerkId || identity.subject !== adminClerkId) {
      throw new ConvexError("Unauthorized access to admin resource.");
    }

    // 1. Delete users
    const users = await ctx.db.query("users").collect();
    for (const u of users) {
      await ctx.db.delete(u._id);
    }
    // 2. Delete contacts
    const contacts = await ctx.db.query("contacts").collect();
    for (const c of contacts) {
      await ctx.db.delete(c._id);
    }
    // 3. Delete trips
    const trips = await ctx.db.query("trips").collect();
    for (const t of trips) {
      await ctx.db.delete(t._id);
    }
    // 4. Delete locationSnapshots
    const snapshots = await ctx.db.query("locationSnapshots").collect();
    for (const s of snapshots) {
      await ctx.db.delete(s._id);
    }
    // 5. Delete safetyChecks
    const checks = await ctx.db.query("safetyChecks").collect();
    for (const ch of checks) {
      await ctx.db.delete(ch._id);
    }
    // 6. Delete vehicles
    const vehicles = await ctx.db.query("vehicles").collect();
    for (const v of vehicles) {
      await ctx.db.delete(v._id);
    }
    // 7. Delete incidents
    const incidents = await ctx.db.query("incidents").collect();
    for (const inc of incidents) {
      await ctx.db.delete(inc._id);
    }
    // 8. Delete postRideSurveys
    const surveys = await ctx.db.query("postRideSurveys").collect();
    for (const s of surveys) {
      await ctx.db.delete(s._id);
    }
    // 9. Delete savedVehicles
    const saved = await ctx.db.query("savedVehicles").collect();
    for (const sv of saved) {
      await ctx.db.delete(sv._id);
    }
    // 10. Delete contributions
    const contributions = await ctx.db.query("contributions").collect();
    for (const con of contributions) {
      await ctx.db.delete(con._id);
    }
    // 11. Delete adminLogs
    const adminLogs = await ctx.db.query("adminLogs").collect();
    for (const al of adminLogs) {
      await ctx.db.delete(al._id);
    }
    // 12. Delete dataAccessLogs
    const dataAccessLogs = await ctx.db.query("dataAccessLogs").collect();
    for (const dal of dataAccessLogs) {
      await ctx.db.delete(dal._id);
    }
    return { success: true };
  },
});
