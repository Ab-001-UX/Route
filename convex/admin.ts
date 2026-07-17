import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

/**
 * Helper: Validates that the requesting Clerk user is the admin.
 * Throws ConvexError if unauthenticated or unauthorized.
 */
async function validateAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthenticated request");
  }

  const adminClerkId = process.env.ADMIN_CLERK_ID;
  if (!adminClerkId || identity.subject !== adminClerkId) {
    throw new ConvexError("Unauthorized access to admin resource.");
  }

  return identity.subject;
}

/**
 * Helper: Appends a log entry to the adminLogs table.
 */
async function logAdminAction(
  ctx: any,
  adminClerkId: string,
  action: string,
  resourceType: string,
  resourceId?: string
) {
  await ctx.db.insert("adminLogs", {
    adminClerkId,
    action,
    resourceType,
    resourceId,
    timestamp: Date.now(),
  });
}

/**
 * QUERY: Retrieve paginated trip logs for the admin panel.
 * Scans most recent first.
 */
export const getAdminTrips = query({
  args: {
    limit: v.number(),
    cursor: v.optional(v.string()), // Optional pagination cursor (or offset)
    offset: v.number(),
  },
  handler: async (ctx, args) => {
    const adminId = await validateAdmin(ctx);
    await logAdminAction(ctx, adminId, "read_trips_list", "trips");

    const allTrips = await ctx.db
      .query("trips")
      .order("desc")
      .collect();

    // Perform pagination in memory for simplicity/flexibility on small dataset
    const paginated = allTrips.slice(args.offset, args.offset + args.limit);
    
    const results = [];
    for (const trip of paginated) {
      const user = await ctx.db.get(trip.userId);
      results.push({
        ...trip,
        phone: user?.phone || "Unknown",
        displayName: user?.displayName || "Commuter",
      });
    }

    return {
      trips: results,
      totalCount: allTrips.length,
    };
  },
});

/**
 * QUERY: Search users by phone number.
 */
export const searchUsersByPhone = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const adminId = await validateAdmin(ctx);
    await logAdminAction(ctx, adminId, `search_users: ${args.searchQuery}`, "users");

    if (!args.searchQuery.trim()) {
      return [];
    }

    const cleanQuery = args.searchQuery.trim();

    // Query users by index or collection scan if prefix match needed
    const allUsers = await ctx.db.query("users").collect();
    const matched = allUsers.filter(u => u.phone.includes(cleanQuery));

    const results = [];
    for (const user of matched) {
      const userTrips = await ctx.db
        .query("trips")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      results.push({
        _id: user._id,
        phone: user.phone,
        displayName: user.displayName || "N/A",
        createdAt: user.createdAt,
        contributorStatus: !!user.contributorStatus,
        tripCount: userTrips.length,
      });
    }

    return results;
  },
});

/**
 * QUERY: Get all active incidents with current statuses.
 */
export const getActiveIncidents = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await validateAdmin(ctx);
    await logAdminAction(ctx, adminId, "read_active_incidents", "incidents");

    const activeIncidents = await ctx.db
      .query("incidents")
      .filter((q) => q.neq(q.field("status"), "resolved"))
      .order("desc")
      .collect();

    const results = [];
    for (const inc of activeIncidents) {
      const trip = await ctx.db.get(inc.tripId);
      const user = trip ? await ctx.db.get(trip.userId) : null;

      results.push({
        ...inc,
        commuterPhone: user?.phone || "N/A",
        commuterName: user?.displayName || "Commuter",
        boardingLocation: trip?.boardingLocation || "N/A",
        transportType: trip?.transportType || "N/A",
      });
    }

    return results;
  },
});

/**
 * QUERY: Retrieve route safety trends and risk distributions.
 */
export const getRiskTrends = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await validateAdmin(ctx);
    await logAdminAction(ctx, adminId, "read_risk_trends", "analytics");

    // Gather vehicles
    const vehicles = await ctx.db.query("vehicles").collect();
    
    // Group flag severity counts
    const severityDistribution = {
      green: 0,
      yellow: 0,
      orange: 0,
      red: 0,
    };

    for (const v of vehicles) {
      const ind = v.safetyIndicator || "green";
      severityDistribution[ind]++;
    }

    // High-risk incidents list
    const incidents = await ctx.db.query("incidents").collect();
    const routeFlagCount: Record<string, number> = {};
    const transportTypeIncidentCount: Record<string, number> = {};

    for (const inc of incidents) {
      const trip = await ctx.db.get(inc.tripId);
      if (trip) {
        // Simple normalization for routes
        const loc = trip.boardingLocation.split("(")[0].trim().toUpperCase();
        routeFlagCount[loc] = (routeFlagCount[loc] || 0) + 1;
        
        const type = trip.transportType;
        transportTypeIncidentCount[type] = (transportTypeIncidentCount[type] || 0) + 1;
      }
    }

    return {
      severityDistribution,
      topRiskRoutes: Object.entries(routeFlagCount)
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      transportTypeDistribution: Object.entries(transportTypeIncidentCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
    };
  },
});

/**
 * QUERY: Detect abuse patterns (high flagging velocity or spamming).
 */
export const detectAbusePatterns = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await validateAdmin(ctx);
    await logAdminAction(ctx, adminId, "detect_abuse_patterns", "abuse");

    const surveys = await ctx.db.query("postRideSurveys").collect();
    
    // Group surveys by userId to identify users who submit high volumes of safety concerns
    const userConcernCounts: Record<string, { total: number; feltOff: number; plates: Set<string> }> = {};

    for (const s of surveys) {
      const uidStr = s.userId.toString();
      if (!userConcernCounts[uidStr]) {
        userConcernCounts[uidStr] = { total: 0, feltOff: 0, plates: new Set() };
      }
      userConcernCounts[uidStr].total++;
      if (s.response === "felt-off") {
        userConcernCounts[uidStr].feltOff++;
      }
      
      const trip = await ctx.db.get(s.tripId);
      if (trip) {
        userConcernCounts[uidStr].plates.add(trip.plate);
      }
    }

    const suspiciousUsers = [];
    for (const [uid, stats] of Object.entries(userConcernCounts)) {
      const ratio = stats.total > 0 ? stats.feltOff / stats.total : 0;
      
      // Flags user if they submitted 3+ safety concerns AND the felt-off ratio is over 75%
      if (stats.feltOff >= 3 && ratio > 0.75) {
        const user = await ctx.db.get(ctx.db.normalizeId("users", uid));
        suspiciousUsers.push({
          userId: uid,
          phone: user?.phone || "N/A",
          displayName: user?.displayName || "N/A",
          totalTrips: stats.total,
          flaggedTrips: stats.feltOff,
          flagRatio: Math.round(ratio * 100),
          uniquePlatesCount: stats.plates.size,
        });
      }
    }

    return suspiciousUsers;
  },
});

/**
 * MUTATION: Admin closes or resolves an incident.
 */
export const resolveIncident = mutation({
  args: {
    incidentId: v.id("incidents"),
    status: v.union(v.literal("verified-concern"), v.literal("resolved")),
  },
  handler: async (ctx, args) => {
    const adminId = await validateAdmin(ctx);
    await logAdminAction(ctx, adminId, `resolve_incident: ${args.incidentId} to ${args.status}`, "incidents", args.incidentId);

    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new ConvexError("Incident not found.");
    }

    await ctx.db.patch(incident._id, {
      status: args.status,
      resolvedAt: args.status === "resolved" ? Date.now() : undefined,
    });

    // If resolving, let's also update the vehicle dangerousStatus/safetyIndicator if appropriate
    if (args.status === "resolved") {
      const trip = await ctx.db.get(incident.tripId);
      if (trip) {
        // Recalculate flag count or dangerousStatus if needed, or simply clean dangerous flags
        const vehicle = await ctx.db
          .query("vehicles")
          .withIndex("by_plate", (q) => q.eq("plate", trip.plate))
          .unique();

        if (vehicle && vehicle.dangerousStatus) {
          // Verify if there are other un-resolved incidents for this vehicle
          const activeIncidents = await ctx.db
            .query("incidents")
            .withIndex("by_plate", (q) => q.eq("plate", trip.plate))
            .filter((q) => q.neq(q.field("status"), "resolved"))
            .collect();
          
          const remainingUnresolved = activeIncidents.filter(i => i._id !== incident._id);
          
          if (remainingUnresolved.length === 0) {
            // No more active incidents, restore vehicle status
            await ctx.db.patch(vehicle._id, {
              dangerousStatus: false,
              safetyIndicator: vehicle.flagCount >= 5 ? "red" : vehicle.flagCount >= 3 ? "orange" : "yellow",
            });
          }
        }
      }
    }

    return { success: true };
  },
});

/**
 * PUBLIC QUERY: Fetch fully anonymized trip dataset for CSV export.
 * Limits details to comply with Day 7 export specifications.
 */
export const getExportDataset = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await validateAdmin(ctx);
    await logAdminAction(ctx, adminId, "export_csv_dataset", "export");

    // Fetch all trips
    const trips = await ctx.db.query("trips").collect();
    const incidents = await ctx.db.query("incidents").collect();
    
    // Create plate to incident mapping
    const plateIncidentsMap = new Map();
    for (const inc of incidents) {
      if (!plateIncidentsMap.has(inc.plate)) {
        plateIncidentsMap.set(inc.plate, []);
      }
      plateIncidentsMap.get(inc.plate).push(inc.incidentType);
    }

    // Anonymize completely (No User ID, Clerk IDs, names, or contact credentials)
    return trips.map(t => {
      const relatedIncidents = plateIncidentsMap.get(t.plate) || [];
      return {
        tripIdHash: t._id.substring(0, 8), // anonymized ID reference
        anonymizedPlateHash: `plate_${t.plate.substring(0, 3)}***`, // anonymized plate hint
        transportType: t.transportType,
        boardingLocation: t.boardingLocation.split("(")[0].trim(), // clean location strings
        status: t.status,
        incidentCount: relatedIncidents.length,
        incidentSummary: relatedIncidents.join(" | ") || "None",
        createdAt: new Date(t.createdAt).toISOString(),
      };
    });
  },
});
