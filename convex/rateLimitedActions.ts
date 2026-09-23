"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { checkRateLimit } from "../lib/upstash";

/**
 * Convex Action: Rate-limits and executes the saveVehicle mutation.
 */
export const rateLimitedSaveVehicle = action({
  args: { plate: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const rateLimit = await checkRateLimit(identity.subject, "vehicle_mutation", 50, 3600);
    if (!rateLimit.success) {
      throw new ConvexError("Rate limit exceeded. Please try again later.");
    }

    return await ctx.runMutation(api.vehicles.saveVehicle, args);
  },
});

/**
 * Convex Action: Rate-limits and executes the unsaveVehicle mutation.
 */
export const rateLimitedUnsaveVehicle = action({
  args: { plate: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const rateLimit = await checkRateLimit(identity.subject, "vehicle_mutation", 50, 3600);
    if (!rateLimit.success) {
      throw new ConvexError("Rate limit exceeded. Please try again later.");
    }

    return await ctx.runMutation(api.vehicles.unsaveVehicle, args);
  },
});

/**
 * Convex Action: Rate-limits and executes the togglePinVehicle mutation.
 */
export const rateLimitedTogglePinVehicle = action({
  args: { plate: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const rateLimit = await checkRateLimit(identity.subject, "vehicle_mutation", 50, 3600);
    if (!rateLimit.success) {
      throw new ConvexError("Rate limit exceeded. Please try again later.");
    }

    return await ctx.runMutation(api.vehicles.togglePinVehicle, args);
  },
});

/**
 * Convex Action: Rate-limits and executes the updateUserSettings mutation.
 */
export const rateLimitedUpdateUserSettings = action({
  args: {
    theme: v.optional(v.string()),
    fontSize: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const rateLimit = await checkRateLimit(identity.subject, "settings_update", 60, 3600);
    if (!rateLimit.success) {
      throw new ConvexError("Rate limit exceeded: Please wait a moment before changing settings again.");
    }

    return await ctx.runMutation(api.users.updateUserSettings, args);
  },
});

/**
 * Convex Action: Rate-limits and executes the flagVehicleByPlate mutation.
 */
export const rateLimitedFlagVehicleByPlate = action({
  args: { plate: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const monthlyLimit = await checkRateLimit(identity.subject, "flag_vehicle_monthly", 4, 2592000);
    if (!monthlyLimit.success) {
      throw new ConvexError("Monthly reporting limit reached. To maintain integrity, reports are strictly limited to ensure sincerity and prevent spam.");
    }

    const rateLimit = await checkRateLimit(identity.subject, `flag_vehicle_${args.plate}`, 5, 86400);
    if (!rateLimit.success) {
      throw new ConvexError("Rate limit exceeded: You have already flagged this vehicle recently.");
    }

    return await ctx.runMutation(api.vehicles.flagVehicleByPlate, args);
  },
});

/**
 * Convex Action: Rate-limits and executes the flagVehicleWithReport mutation.
 */
export const rateLimitedFlagVehicleWithReport = action({
  args: {
    plate: v.string(),
    vehicleType: v.string(),
    location: v.string(),
    time: v.string(),
    incidentType: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const monthlyLimit = await checkRateLimit(identity.subject, "flag_vehicle_monthly", 4, 2592000);
    if (!monthlyLimit.success) {
      throw new ConvexError("Monthly reporting limit reached. To maintain integrity, reports are strictly limited to ensure sincerity and prevent spam.");
    }

    return await ctx.runMutation(api.vehicles.flagVehicleWithReport, args);
  },
});
