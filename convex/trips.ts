import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { plateSchema } from "../lib/validators";

/**
 * Creates a new trip summary for the authenticated user.
 */
export const createTrip = mutation({
  args: {
    plate: v.string(),
    transportType: v.string(),
    boardingLocation: v.string(),
    destination: v.optional(v.string()),
    description: v.optional(v.string()),
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

    // 1. Validate Plate Input
    const parsedPlate = plateSchema.safeParse(args.plate);
    if (!parsedPlate.success) {
      throw new ConvexError(parsedPlate.error.issues[0].message);
    }
    const cleanPlate = parsedPlate.data;

    // 2. Insert the new trip summary
    const tripId = await ctx.db.insert("trips", {
      userId: user._id,
      plate: cleanPlate,
      transportType: args.transportType,
      boardingLocation: args.boardingLocation,
      destination: args.destination,
      description: args.description,
      createdAt: Date.now(),
    });

    // 3. Ensure vehicle record exists in database
    const existingVehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_plate", (q) => q.eq("plate", cleanPlate))
      .unique();

    if (!existingVehicle) {
      await ctx.db.insert("vehicles", {
        plate: cleanPlate,
        transportType: args.transportType,
        description: args.description || "Registered by Lagos commuter",
        flagCount: 0,
        safetyIndicator: "green",
        dangerousStatus: false,
        lastFlaggedAt: Date.now(),
      });
    }

    // Update user's daily trip count
    await ctx.db.patch(user._id, {
      tripCountToday: user.tripCountToday + 1,
    });

    return {
      tripId,
      plate: cleanPlate,
      transportType: args.transportType,
      boardingLocation: args.boardingLocation,
      destination: args.destination,
      description: args.description,
      userName: user.displayName || "Commuter",
    };
  },
});

/**
 * Returns all trip summaries logged by the authenticated user.
 */
export const getTrips = query({
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
      .query("trips")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Returns details for a single trip owned by the authenticated user.
 */
export const getTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new ConvexError("Trip not found or unauthorized");
    }

    return trip;
  },
});

/**
 * PUBLIC QUERY: Fetches trip summary details for loved ones viewing the WhatsApp share link.
 * Requires no authentication.
 */
export const getTripPublic = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      return null;
    }

    const user = await ctx.db.get(trip.userId);

    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_plate", (q) => q.eq("plate", trip.plate))
      .unique();

    return {
      _id: trip._id,
      plate: trip.plate,
      transportType: trip.transportType,
      boardingLocation: trip.boardingLocation,
      destination: trip.destination,
      description: trip.description,
      createdAt: trip.createdAt,
      userName: user ? (user.displayName || "A loved one") : "A loved one",
      flagCount: vehicle ? vehicle.flagCount : 0,
      safetyIndicator: vehicle ? vehicle.safetyIndicator : "green",
      dangerousStatus: vehicle ? vehicle.dangerousStatus : false,
    };
  },
});
