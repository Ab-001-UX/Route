"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { checkRateLimit } from "../lib/upstash";

/**
 * Convex Action: Rate-limits and executes the addContact mutation.
 * Limit: 10 per user per day (86400 seconds)
 */
export const rateLimitedAddContact = action({
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

    const rateLimit = await checkRateLimit(identity.subject, "add_contact", 10, 86400);
    if (!rateLimit.success) {
      throw new ConvexError("Rate limit exceeded: You can only add up to 10 contacts per day.");
    }

    return await ctx.runMutation(api.contacts.addContact, args);
  },
});

/**
 * Convex Action: Rate-limits and executes the resendInvite mutation.
 * Limit: 10 per user per day (86400 seconds)
 */
export const rateLimitedResendInvite = action({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const rateLimit = await checkRateLimit(identity.subject, "resend_invite", 10, 86400);
    if (!rateLimit.success) {
      throw new ConvexError("Rate limit exceeded: You can only regenerate invite links 10 times per day.");
    }

    return await ctx.runMutation(api.contacts.resendInvite, args);
  },
});

/**
 * Convex Action: Rate-limits and executes the saveVehicle mutation.
 * Limit: 50 per user per hour (3600 seconds)
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
 * Limit: 50 per user per hour (3600 seconds)
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
 * Limit: 50 per user per hour (3600 seconds)
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
 * Convex Action: Rate-limits and executes the submitPostRideSurvey mutation.
 * Limit: 5 per trip
 */
export const rateLimitedSubmitPostRideSurvey = action({
  args: {
    tripId: v.id("trips"),
    response: v.union(v.literal("smooth"), v.literal("felt-off")),
    incidentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    const rateLimit = await checkRateLimit(identity.subject, `survey_${args.tripId}`, 5, 86400);
    if (!rateLimit.success) {
      throw new ConvexError("Rate limit exceeded: You have already submitted feedback for this trip multiple times.");
    }

    return await ctx.runMutation(api.trips.submitPostRideSurvey, args);
  },
});

/**
 * Convex Action: Rate-limits and executes the updateUserSettings mutation.
 * Limit: 60 per user per hour (3600 seconds)
 */
export const rateLimitedUpdateUserSettings = action({
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

    const rateLimit = await checkRateLimit(identity.subject, "settings_update", 60, 3600);
    if (!rateLimit.success) {
      throw new ConvexError("Rate limit exceeded: Please wait a moment before changing settings again.");
    }

    return await ctx.runMutation(api.users.updateUserSettings, args);
  },
});

/**
 * Convex Action: Rate-limits and executes the flagVehicleByPlate mutation.
 * Limit: 5 per user per day (86400 seconds)
 */
export const rateLimitedFlagVehicleByPlate = action({
  args: { plate: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated request");
    }

    // Global monthly limit: max 4 reports/flags per month
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
 * Limit: 4 detailed flag reports per user per month.
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

    // Global monthly limit: max 4 reports/flags per month
    const monthlyLimit = await checkRateLimit(identity.subject, "flag_vehicle_monthly", 4, 2592000);
    if (!monthlyLimit.success) {
      throw new ConvexError("Monthly reporting limit reached. To maintain integrity, reports are strictly limited to ensure sincerity and prevent spam.");
    }

    return await ctx.runMutation(api.vehicles.flagVehicleWithReport, args);
  },
});
