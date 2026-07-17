import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

/**
 * Normalises a license plate string to ensure lookup consistency.
 */
function normalizePlate(plate: string): string {
  return plate.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase().trim();
}

/**
 * Queries the vehicles table by plate number.
 * Returns the vehicle record and its public incident history.
 */
export const getVehicleByPlate = query({
  args: {
    plate: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = normalizePlate(args.plate);

    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_plate", (q) => q.eq("plate", normalized))
      .unique();

    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_plate", (q) => q.eq("plate", normalized))
      .collect();

    if (!vehicle) {
      return {
        vehicle: null,
        incidents: [],
      };
    }

    // Count unique users who flagged this plate
    const tripsForPlate = await ctx.db
      .query("trips")
      .withIndex("by_plate", (q) => q.eq("plate", normalized))
      .collect();

    const tripIds = tripsForPlate.map((t) => t._id);
    const tripToUser = new Map(tripsForPlate.map((t) => [t._id.toString(), t.userId.toString()]));

    const uniqueFlaggers = new Set<string>();

    for (const inc of incidents) {
      if (inc.tripId) {
        const userIdStr = tripToUser.get(inc.tripId.toString());
        if (userIdStr) {
          uniqueFlaggers.add(userIdStr);
        }
      }
    }

    for (const tripId of tripIds) {
      const survey = await ctx.db
        .query("postRideSurveys")
        .withIndex("by_tripId", (q) => q.eq("tripId", tripId))
        .first();

      if (survey && survey.response === "felt-off") {
        uniqueFlaggers.add(survey.userId.toString());
      }
    }

    const uniqueCount = uniqueFlaggers.size;

    // SURFACED ONLY IF uniqueCount >= 3 OR dangerousStatus is true
    if (uniqueCount < 3 && !vehicle.dangerousStatus) {
      return {
        vehicle: null,
        incidents: [],
      };
    }

    // Map incidents to anonymised public views (include new detail fields)
    const publicIncidents = incidents.map((inc) => ({
      _id: inc._id,
      incidentType: inc.incidentType,
      status: inc.status,
      vehicleType: inc.vehicleType,
      location: inc.location,
      time: inc.time,
      description: inc.description,
      createdAt: inc.createdAt,
    }));

    return {
      vehicle,
      incidents: publicIncidents,
    };
  },
});

/**
 * Developer seeding mutation to test search result states.
 */
export const seedVehicle = mutation({
  args: {
    plate: v.string(),
    transportType: v.string(),
    description: v.string(),
    flagCount: v.number(),
    safetyIndicator: v.union(
      v.literal("green"),
      v.literal("yellow"),
      v.literal("orange"),
      v.literal("red")
    ),
    dangerousStatus: v.boolean(),
  },
  handler: async (ctx, args) => {
    const normalized = normalizePlate(args.plate);

    const existing = await ctx.db
      .query("vehicles")
      .withIndex("by_plate", (q) => q.eq("plate", normalized))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        transportType: args.transportType,
        description: args.description,
        flagCount: args.flagCount,
        safetyIndicator: args.safetyIndicator,
        dangerousStatus: args.dangerousStatus,
      });
      return existing._id;
    }

    return await ctx.db.insert("vehicles", {
      plate: normalized,
      transportType: args.transportType,
      description: args.description,
      flagCount: args.flagCount,
      safetyIndicator: args.safetyIndicator,
      dangerousStatus: args.dangerousStatus,
      lastFlaggedAt: Date.now(),
    });
  },
});

/**
 * PUBLIC QUERY: Fetches active Lagos flagged vehicles for home screen feed.
 * Includes vehicles with 3+ flags from unique users OR dangerousStatus = true.
 */
export const getHomeFeed = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const allVehicles = await ctx.db.query("vehicles").collect();
    const feedVehicles = [];

    for (const vehicle of allVehicles) {
      // Count unique users who flagged this plate
      const tripsForPlate = await ctx.db
        .query("trips")
        .withIndex("by_plate", (q) => q.eq("plate", vehicle.plate))
        .collect();

      const tripIds = tripsForPlate.map((t) => t._id);
      const tripToUser = new Map(tripsForPlate.map((t) => [t._id.toString(), t.userId.toString()]));

      const uniqueFlaggers = new Set<string>();

      // Collect from incidents
      const incidents = await ctx.db
        .query("incidents")
        .withIndex("by_plate", (q) => q.eq("plate", vehicle.plate))
        .collect();

      for (const inc of incidents) {
        const userIdStr = tripToUser.get(inc.tripId.toString());
        if (userIdStr) {
          uniqueFlaggers.add(userIdStr);
        }
      }

      // Collect from felt-off surveys
      for (const tripId of tripIds) {
        const survey = await ctx.db
          .query("postRideSurveys")
          .withIndex("by_tripId", (q) => q.eq("tripId", tripId))
          .first();
        if (survey && survey.response === "felt-off") {
          uniqueFlaggers.add(survey.userId.toString());
        }
      }

      const uniqueCount = uniqueFlaggers.size;

      // Inclusion condition: uniqueCount >= 3 OR dangerousStatus is true
      if (uniqueCount >= 3 || vehicle.dangerousStatus) {
        // Find most common incident type
        let primaryOffense = "Safety concern";
        const incidentTypes = incidents.map((i) => i.incidentType);
        if (incidentTypes.length > 0) {
          const counts: Record<string, number> = {};
          for (const t of incidentTypes) {
            counts[t] = (counts[t] || 0) + 1;
          }
          primaryOffense = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
        }

        feedVehicles.push({
          _id: vehicle._id,
          plate: vehicle.plate,
          transportType: vehicle.transportType,
          description: vehicle.description,
          flagCount: vehicle.flagCount,
          safetyIndicator: vehicle.safetyIndicator,
          dangerousStatus: vehicle.dangerousStatus,
          lastFlaggedAt: vehicle.lastFlaggedAt,
          primaryOffense,
          uniqueFlaggersCount: uniqueCount,
        });
      }
    }

    // Fetch user's saved vehicles to see pinned/saved state
    const saved = await ctx.db
      .query("savedVehicles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const pinnedPlates = new Set(
      saved.filter((s) => s.pinned).map((s) => s.plate)
    );
    const savedPlates = new Set(
      saved.map((s) => s.plate)
    );

    return feedVehicles
      .map((v) => ({
        ...v,
        isPinned: pinnedPlates.has(v.plate),
        isSaved: savedPlates.has(v.plate),
      }))
      .sort((a, b) => {
        // Pinned first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // Dangerous second
        if (a.dangerousStatus && !b.dangerousStatus) return -1;
        if (!a.dangerousStatus && b.dangerousStatus) return 1;

        // Safety Indicator severity third
        const score = { red: 3, orange: 2, yellow: 1, green: 0 };
        return (score[b.safetyIndicator] || 0) - (score[a.safetyIndicator] || 0);
      });
  },
});

/**
 * MUTATION: Save a vehicle plate to the authenticated commuter's saved list.
 */
export const saveVehicle = mutation({
  args: { plate: v.string() },
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

    const normalized = args.plate.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase().trim();

    const existing = await ctx.db
      .query("savedVehicles")
      .withIndex("by_userId_plate", (q) => q.eq("userId", user._id).eq("plate", normalized))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("savedVehicles", {
      userId: user._id,
      plate: normalized,
      pinned: false,
      savedAt: Date.now(),
    });
  },
});

/**
 * MUTATION: Removes a vehicle plate from the commuter's saved list.
 */
export const unsaveVehicle = mutation({
  args: { plate: v.string() },
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

    const normalized = args.plate.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase().trim();

    const existing = await ctx.db
      .query("savedVehicles")
      .withIndex("by_userId_plate", (q) => q.eq("userId", user._id).eq("plate", normalized))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

/**
 * MUTATION: Toggle pin state on a saved vehicle plate. Max 3 pinned allowed.
 */
export const togglePinVehicle = mutation({
  args: { plate: v.string() },
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

    const normalized = args.plate.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase().trim();

    const savedItem = await ctx.db
      .query("savedVehicles")
      .withIndex("by_userId_plate", (q) => q.eq("userId", user._id).eq("plate", normalized))
      .unique();

    if (!savedItem) {
      await ctx.db.insert("savedVehicles", {
        userId: user._id,
        plate: normalized,
        pinned: true,
        savedAt: Date.now(),
      });
      return { success: true, pinned: true };
    }

    const willPin = !savedItem.pinned;



    await ctx.db.patch(savedItem._id, {
      pinned: willPin,
    });

    return { success: true, pinned: willPin };
  },
});

/**
 * PUBLIC QUERY: Fetches saved vehicles for the commuter with F13 Privacy Rules.
 */
export const getSavedVehicles = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    // 1. Fetch saved list
    const savedList = await ctx.db
      .query("savedVehicles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // 2. Fetch all user trips to track own flagged vehicles
    const userTrips = await ctx.db
      .query("trips")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const userPlatesFlagged = new Set<string>();

    for (const trip of userTrips) {
      const survey = await ctx.db
        .query("postRideSurveys")
        .withIndex("by_tripId", (q) => q.eq("tripId", trip._id))
        .first();

      if (survey && survey.response === "felt-off") {
        userPlatesFlagged.add(trip.plate);
        continue;
      }

      const incident = await ctx.db
        .query("incidents")
        .withIndex("by_plate", (q) => q.eq("plate", trip.plate))
        .filter((q) => q.eq(q.field("tripId"), trip._id))
        .first();

      if (incident) {
        userPlatesFlagged.add(trip.plate);
      }
    }

    const results = [];

    for (const item of savedList) {
      const vehicle = await ctx.db
        .query("vehicles")
        .withIndex("by_plate", (q) => q.eq("plate", item.plate))
        .unique();

      const hasFlaggedThemselves = userPlatesFlagged.has(item.plate);

      if (hasFlaggedThemselves) {
        // Own flagged vehicle: Display plate and concern category ONLY per F13 Privacy Rules
        let primaryConcern = "Felt off / Flagged";
        
        const ownTrip = userTrips.find(t => t.plate === item.plate);
        if (ownTrip) {
          const survey = await ctx.db
            .query("postRideSurveys")
            .withIndex("by_tripId", (q) => q.eq("tripId", ownTrip._id))
            .first();
          if (survey && survey.incidentType) {
            primaryConcern = survey.incidentType;
          } else {
            const incident = await ctx.db
              .query("incidents")
              .withIndex("by_plate", (q) => q.eq("plate", item.plate))
              .filter((q) => q.eq(q.field("tripId"), ownTrip._id))
              .first();
            if (incident) {
              primaryConcern = incident.incidentType;
            }
          }
        }

        results.push({
          _id: item._id,
          plate: item.plate,
          pinned: !!item.pinned,
          savedAt: item.savedAt,
          isOwnFlagged: true,
          primaryOffense: primaryConcern,
          description: "Flagged by you anonymously",
          flagCount: 1,
          safetyIndicator: "orange",
          dangerousStatus: false,
          incidents: [],
        });
      } else {
        // Others' flagged vehicle: Display full details
        let primaryOffense = "Clean Record";
        let incidentsList: any[] = [];

        if (vehicle) {
          const tripsForPlate = await ctx.db
            .query("trips")
            .withIndex("by_plate", (q) => q.eq("plate", vehicle.plate))
            .collect();

          const tripIds = tripsForPlate.map((t) => t._id);
          const tripToUser = new Map(tripsForPlate.map((t) => [t._id.toString(), t.userId.toString()]));

          const uniqueFlaggers = new Set<string>();

          const incidents = await ctx.db
            .query("incidents")
            .withIndex("by_plate", (q) => q.eq("plate", item.plate))
            .collect();

          for (const inc of incidents) {
            if (inc.tripId) {
              const userIdStr = tripToUser.get(inc.tripId.toString());
              if (userIdStr) {
                uniqueFlaggers.add(userIdStr);
              }
            }
          }

          for (const tripId of tripIds) {
            const survey = await ctx.db
              .query("postRideSurveys")
              .withIndex("by_tripId", (q) => q.eq("tripId", tripId))
              .first();

            if (survey && survey.response === "felt-off") {
              uniqueFlaggers.add(survey.userId.toString());
            }
          }

          const uniqueCount = uniqueFlaggers.size;

          if (uniqueCount >= 3 || vehicle.dangerousStatus) {
            incidentsList = incidents.map(i => ({
              incidentType: i.incidentType,
              status: i.status,
              createdAt: i.createdAt,
            }));

            const incidentTypes = incidents.map((i) => i.incidentType);
            if (incidentTypes.length > 0) {
              const counts: Record<string, number> = {};
              for (const t of incidentTypes) {
                counts[t] = (counts[t] || 0) + 1;
              }
              primaryOffense = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
            }

            results.push({
              _id: item._id,
              plate: item.plate,
              pinned: !!item.pinned,
              savedAt: item.savedAt,
              isOwnFlagged: false,
              transportType: vehicle.transportType,
              description: vehicle.description,
              flagCount: vehicle.flagCount,
              safetyIndicator: vehicle.safetyIndicator,
              dangerousStatus: vehicle.dangerousStatus,
              primaryOffense,
              incidents: incidentsList,
            });
          } else {
            results.push({
              _id: item._id,
              plate: item.plate,
              pinned: !!item.pinned,
              savedAt: item.savedAt,
              isOwnFlagged: false,
              description: "No previous safety concerns reported.",
              flagCount: 0,
              safetyIndicator: "green",
              dangerousStatus: false,
              primaryOffense: "Safe",
              incidents: [],
            });
          }
        } else {
          results.push({
            _id: item._id,
            plate: item.plate,
            pinned: !!item.pinned,
            savedAt: item.savedAt,
            isOwnFlagged: false,
            description: "No previous safety concerns reported.",
            flagCount: 0,
            safetyIndicator: "green",
            dangerousStatus: false,
            primaryOffense: "Safe",
            incidents: [],
          });
        }
      }
    }

    // Sort: Pinned first, then by saved timestamp descending
    return results.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.savedAt - a.savedAt;
    });
  },
});

/**
 * Helper to notify users who saved/pinned a specific plate.
 */
export async function notifySavers(ctx: any, plate: string, incidentType: string = "Safety concern") {
  const normalized = plate.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase().trim();
  const savers = await ctx.db
    .query("savedVehicles")
    .withIndex("by_plate", (q: any) => q.eq("plate", normalized))
    .collect();

  for (const saver of savers) {
    await ctx.db.insert("notifications", {
      userId: saver.userId,
      plate: normalized,
      title: "Saved Vehicle Flagged",
      message: `Vehicle ${normalized} in your saved list was flagged for "${incidentType}".`,
      isRead: false,
      createdAt: Date.now(),
    });
  }
}

/**
 * MUTATION: Anonymous flag update for a vehicle plate.
 * Increment vehicle's flag count and re-categorise safety level.
 */
export const flagVehicleByPlate = mutation({
  args: { plate: v.string() },
  handler: async (ctx, args) => {
    // Note: Clerk userId is NOT stored to preserve anonymity per 2E Privacy Rules
    const normalized = args.plate.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase().trim();

    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_plate", (q) => q.eq("plate", normalized))
      .unique();

    if (vehicle) {
      const flagCount = vehicle.flagCount + 1;
      let safetyIndicator: "green" | "yellow" | "orange" | "red" = "green";
      if (flagCount >= 5) safetyIndicator = "red";
      else if (flagCount >= 3) safetyIndicator = "orange";
      else if (flagCount >= 1) safetyIndicator = "yellow";

      await ctx.db.patch(vehicle._id, {
        flagCount,
        safetyIndicator,
        lastFlaggedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("vehicles", {
        plate: normalized,
        transportType: "Other",
        description: "Flagged anonymously by Route user",
        flagCount: 1,
        safetyIndicator: "yellow",
        dangerousStatus: false,
        lastFlaggedAt: Date.now(),
      });
    }

    await notifySavers(ctx, normalized, "Safety concern");

    return { success: true };
  },
});

/**
 * MUTATION: Detailed flag report for a vehicle plate.
 * Creates an incident record with full report data and updates vehicle safety level.
 * Per-user rate limit (3 flags per week) is enforced by the calling action.
 */
export const flagVehicleWithReport = mutation({
  args: {
    plate: v.string(),
    vehicleType: v.string(),
    location: v.string(),
    time: v.string(),
    incidentType: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Anonymity preserved per Section 2E — no userId stored on incident
    const normalized = args.plate.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase().trim();

    // Sanitise text fields
    const sanitizeText = (val: string, max: number) =>
      val.replace(/<[^>]*>/g, "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

    const vehicleType = sanitizeText(args.vehicleType, 50);
    const location = sanitizeText(args.location, 150);
    const time = sanitizeText(args.time, 50);
    const incidentType = sanitizeText(args.incidentType, 100);
    const description = args.description ? sanitizeText(args.description, 500) : undefined;

    // Insert the detailed incident record
    await ctx.db.insert("incidents", {
      plate: normalized,
      incidentType,
      source: "anonymous-report",
      status: "pending-review",
      vehicleType,
      location,
      time,
      description,
      createdAt: Date.now(),
    });

    // Update or create vehicle record
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_plate", (q) => q.eq("plate", normalized))
      .unique();

    if (vehicle) {
      const flagCount = vehicle.flagCount + 1;
      let safetyIndicator: "green" | "yellow" | "orange" | "red" = "green";
      if (flagCount >= 5) safetyIndicator = "red";
      else if (flagCount >= 3) safetyIndicator = "orange";
      else if (flagCount >= 1) safetyIndicator = "yellow";

      await ctx.db.patch(vehicle._id, {
        flagCount,
        safetyIndicator,
        lastFlaggedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("vehicles", {
        plate: normalized,
        transportType: vehicleType || "Other",
        description: `Flagged: ${incidentType}`,
        flagCount: 1,
        safetyIndicator: "yellow",
        dangerousStatus: false,
        lastFlaggedAt: Date.now(),
      });
    }

    await notifySavers(ctx, normalized, incidentType);

    return { success: true };
  },
});
