import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { plateSchema, incidentTypeSchema } from "../lib/validators";
import { api } from "./_generated/api";
import { notifySavers } from "./vehicles";

/**
 * Creates a new trip for the authenticated user.
 * Enforces the survey gate.
 * Queues the triggerSafetyCheck action to fire at timerExpiry.
 */
export const createTrip = mutation({
  args: {
    plate: v.string(),
    transportType: v.string(),
    boardingLocation: v.string(),
    destination: v.optional(v.string()),
    description: v.optional(v.string()),
    boardingGPS: v.object({
      encryptedLat: v.string(),
      encryptedLng: v.string(),
    }),
    timerExpiry: v.number(),
    safetyContactId: v.id("contacts"),
    alertContactIds: v.array(v.id("contacts")),
    safetyCheckTokenHash: v.string(),
    safetyCheckTokenExpiresAt: v.number(),
    plaintextToken: v.string(), // Plaintext token passed for scheduling
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

    // 1. Validate Input (Plate validation)
    const parsedPlate = plateSchema.safeParse(args.plate);
    if (!parsedPlate.success) {
      throw new ConvexError(parsedPlate.error.issues[0].message);
    }

    // 2. Enforce Post-Ride Survey Gate
    const lastTrip = await ctx.db
      .query("trips")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (lastTrip && lastTrip.status !== "active" && !lastTrip.postRideAnswered) {
      throw new ConvexError("Trip gate: You must complete the post-ride survey for your previous trip before logging a new one.");
    }

    // 3. Insert the new trip
    const tripId = await ctx.db.insert("trips", {
      userId: user._id,
      plate: parsedPlate.data,
      transportType: args.transportType,
      boardingLocation: args.boardingLocation,
      destination: args.destination,
      description: args.description,
      boardingGPS: args.boardingGPS,
      timerExpiry: args.timerExpiry,
      safetyContactId: args.safetyContactId,
      alertContactIds: args.alertContactIds,
      safetyCheckTokenHash: args.safetyCheckTokenHash,
      safetyCheckTokenExpiresAt: args.safetyCheckTokenExpiresAt,
      safetyCheckTokenUsed: false,
      status: "active",
      postRideAnswered: false,
      createdAt: Date.now(),
    });

    // 4. Initialize Safety Check Row
    await ctx.db.insert("safetyChecks", {
      tripId,
      contactId: args.safetyContactId,
      response: null,
      trafficRecheckCount: 0,
      retryCount: 0,
      followUpSent: false,
      followUpResponse: null,
    });

    // 5. Schedule Safety Check Action at Expiry
    await ctx.scheduler.runAt(args.timerExpiry, api.safetyActions.triggerSafetyCheck, {
      tripId,
      plaintextToken: args.plaintextToken,
    });

    // 6. Log Access & Retrieve Contact Records
    const now = Date.now();
    
    // Safety Contact details
    const safetyContact = await ctx.db.get(args.safetyContactId);
    if (!safetyContact || safetyContact.userId !== user._id) {
      throw new ConvexError("Safety contact not found or unauthorized");
    }
    await ctx.db.insert("dataAccessLogs", {
      userId: identity.subject,
      action: "read_contact_phone",
      resourceType: "contacts",
      resourceId: args.safetyContactId,
      timestamp: now,
    });

    // Alert Contacts details
    const alertContacts = [];
    for (const contactId of args.alertContactIds) {
      const contact = await ctx.db.get(contactId);
      if (!contact || contact.userId !== user._id) {
        throw new ConvexError(`Alert contact ${contactId} not found or unauthorized`);
      }
      alertContacts.push({
        _id: contact._id,
        name: contact.name,
        phone: contact.phone,
        encryptedFcmToken: contact.encryptedFcmToken,
      });

      await ctx.db.insert("dataAccessLogs", {
        userId: identity.subject,
        action: "read_contact_phone",
        resourceType: "contacts",
        resourceId: contactId,
        timestamp: now,
      });
    }

    return {
      tripId,
      userName: user.displayName || user.phone,
      safetyContact: {
        name: safetyContact.name,
        phone: safetyContact.phone,
        encryptedFcmToken: safetyContact.encryptedFcmToken,
      },
      alertContacts,
    };
  },
});

/**
 * MUTATION: Transition trip status to pending-review at timer expiry.
 * Called by scheduled actions.
 */
export const transitionToPendingReview = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.status !== "active") return null;

    await ctx.db.patch(trip._id, {
      status: "pending-review",
    });

    const user = await ctx.db.get(trip.userId);
    const safetyContact = await ctx.db.get(trip.safetyContactId);

    if (safetyContact) {
      await ctx.db.insert("dataAccessLogs", {
        userId: "system_scheduled_action",
        action: "read_contact_phone",
        resourceType: "contacts",
        resourceId: trip.safetyContactId,
        timestamp: Date.now(),
      });
    }

    return {
      tripId: trip._id,
      plate: trip.plate,
      transportType: trip.transportType,
      boardingLocation: trip.boardingLocation,
      userName: user ? (user.displayName || user.phone) : "Commuter",
      safetyContact: safetyContact ? {
        name: safetyContact.name,
        phone: safetyContact.phone,
        encryptedFcmToken: safetyContact.encryptedFcmToken,
      } : null,
    };
  },
});

/**
 * MUTATION: Record safety check response from a contact.
 * Validates check status, updates status machine, resets timer or creates incidents.
 */
export const recordSafetyCheckResponse = mutation({
  args: {
    tripId: v.id("trips"),
    response: v.union(v.literal("yes"), v.literal("no"), v.literal("stuck-in-traffic"), v.literal("maybe")),
    plaintextToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip record not found");
    }

    if (trip.safetyCheckTokenUsed) {
      throw new ConvexError("This safety link has already been verified or invalidated.");
    }

    const safetyCheck = await ctx.db
      .query("safetyChecks")
      .filter((q) => q.eq(q.field("tripId"), trip._id))
      .first();

    if (!safetyCheck) {
      throw new ConvexError("Safety check record not found");
    }

    const user = await ctx.db.get(trip.userId);
    const userName = user ? (user.displayName || user.phone) : "Commuter";

    if (args.response === "yes") {
      // 1. Mark trip as safe
      await ctx.db.patch(trip._id, {
        status: "safe",
        safetyCheckTokenUsed: true,
      });

      await ctx.db.patch(safetyCheck._id, {
        response: "yes",
        respondedAt: Date.now(),
      });

      return { success: true, option: "yes", userName };
    }

    if (args.response === "stuck-in-traffic" || args.response === "maybe") {
      // 2. Traffic triage: reset timer for 15 minutes, keep active, increment count
      const recheckCount = safetyCheck.trafficRecheckCount + 1;
      const newTimerExpiry = Date.now() + 15 * 60 * 1000;

      await ctx.db.patch(trip._id, {
        status: "active",
        timerExpiry: newTimerExpiry,
      });

      await ctx.db.patch(safetyCheck._id, {
        response: "stuck-in-traffic",
        trafficRecheckCount: recheckCount,
        respondedAt: Date.now(),
      });

      if (args.plaintextToken) {
        await ctx.scheduler.runAt(newTimerExpiry, api.safetyActions.triggerSafetyCheck, {
          tripId: trip._id,
          plaintextToken: args.plaintextToken,
        });
      }

      return {
        success: true,
        option: "traffic",
        newTimerExpiry,
        userName,
        recheckCount,
      };
    }

    if (args.response === "no") {
      // 3. Emergency NO: transition status, register incident
      await ctx.db.patch(trip._id, {
        status: "incident-triggered",
        safetyCheckTokenUsed: true,
      });

      await ctx.db.patch(safetyCheck._id, {
        response: "no",
        respondedAt: Date.now(),
      });

      // Insert incident report
      await ctx.db.insert("incidents", {
        tripId: trip._id,
        plate: trip.plate,
        incidentType: "safety-check-no",
        source: "contact-no",
        status: "pending-review",
        createdAt: Date.now(),
      });

      // Increment vehicle flag count in Lagos community database
      const vehicle = await ctx.db
        .query("vehicles")
        .withIndex("by_plate", (q) => q.eq("plate", trip.plate))
        .unique();

      if (vehicle) {
        const isRecheckNo = safetyCheck.trafficRecheckCount > 0;
        await ctx.db.patch(vehicle._id, {
          flagCount: vehicle.flagCount + 1,
          dangerousStatus: isRecheckNo ? true : vehicle.dangerousStatus,
          safetyIndicator: isRecheckNo ? "red" : vehicle.safetyIndicator,
          lastFlaggedAt: Date.now(),
        });
      }

      return { success: true, option: "no", userName };
    }

    return { success: false, option: "none" };
  },
});

/**
 * MUTATION: Called by scheduler retry jobs to record attempts.
 */
export const recordRetryAttempt = mutation({
  args: { tripId: v.id("trips"), retryCount: v.number() },
  handler: async (ctx, args) => {
    const safetyCheck = await ctx.db
      .query("safetyChecks")
      .filter((q) => q.eq(q.field("tripId"), args.tripId))
      .first();

    if (safetyCheck) {
      await ctx.db.patch(safetyCheck._id, {
        retryCount: args.retryCount,
      });
    }
  },
});

/**
 * MUTATION: Called when all safety check retries expire without response.
 */
export const markContactUnresponsive = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return;

    await ctx.db.patch(trip._id, {
      status: "pending-review",
    });

    const safetyCheck = await ctx.db
      .query("safetyChecks")
      .filter((q) => q.eq(q.field("tripId"), args.tripId))
      .first();

    if (safetyCheck) {
      const contact = await ctx.db.get(safetyCheck.contactId);
      if (contact) {
        const missedCount = contact.missedCheckIns + 1;
        await ctx.db.patch(contact._id, {
          missedCheckIns: missedCount,
          status: missedCount >= 5 ? "unresponsive" : contact.status,
        });
      }
    }

    // Insert incident for missed check
    await ctx.db.insert("incidents", {
      tripId: trip._id,
      plate: trip.plate,
      incidentType: "missed-check-in",
      source: "missed-check",
      status: "pending-review",
      createdAt: Date.now(),
    });
  },
});

/**
 * Returns all trips logged by the authenticated user, ordered by date descending.
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
 * PUBLIC QUERY: Fetches trip and check metadata without auth.
 */
export const getTripPublic = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    // If system retry action calls it with empty hash, let it bypass, but wait -
    // retry actions can pass the hash. For system calls, we query by ID if provided,
    // but here we can just lookup by safetyCheckTokenHash.
    if (args.tokenHash === "") {
      return null;
    }

    const trip = await ctx.db
      .query("trips")
      .withIndex("by_safetyCheckTokenHash", (q) => q.eq("safetyCheckTokenHash", args.tokenHash))
      .unique();

    if (!trip) {
      return null;
    }

    const safetyCheck = await ctx.db
      .query("safetyChecks")
      .filter((q) => q.eq(q.field("tripId"), trip._id))
      .first();

    const user = await ctx.db.get(trip.userId);
    const safetyContact = await ctx.db.get(trip.safetyContactId);

    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_plate", (q) => q.eq("plate", trip.plate))
      .unique();
    const flagCount = vehicle ? vehicle.flagCount : 0;

    return {
      _id: trip._id,
      plate: trip.plate,
      transportType: trip.transportType,
      boardingLocation: trip.boardingLocation,
      destination: trip.destination,
      description: trip.description,
      boardingGPS: trip.boardingGPS,
      status: trip.status,
      safetyCheckTokenUsed: trip.safetyCheckTokenUsed,
      safetyCheckTokenExpiresAt: trip.safetyCheckTokenExpiresAt,
      userName: user ? (user.displayName || user.phone) : "Commuter",
      trafficRecheckCount: safetyCheck ? safetyCheck.trafficRecheckCount : 0,
      flagCount,
      safetyContact: safetyContact ? {
        name: safetyContact.name,
        encryptedFcmToken: safetyContact.encryptedFcmToken,
      } : null,
    };
  },
});

/**
 * PUBLIC QUERY: Fetches trip status for background scheduled retries.
 */
export const getTripStatusForRetry = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;
    const user = await ctx.db.get(trip.userId);
    const safetyContact = await ctx.db.get(trip.safetyContactId);
    
    if (safetyContact) {
      await ctx.db.insert("dataAccessLogs", {
        userId: "system_scheduled_action",
        action: "read_contact_phone",
        resourceType: "contacts",
        resourceId: trip.safetyContactId,
        timestamp: Date.now(),
      });
    }

    return {
      status: trip.status,
      safetyCheckTokenUsed: trip.safetyCheckTokenUsed,
      userName: user ? (user.displayName || user.phone) : "Commuter",
      plate: trip.plate,
      safetyContact: safetyContact ? {
        name: safetyContact.name,
        phone: safetyContact.phone,
        encryptedFcmToken: safetyContact.encryptedFcmToken,
      } : null,
    };
  },
});

/**
 * MUTATION: Ends a trip and marks it as safe.
 */
export const endTrip = mutation({
  args: { tripId: v.id("trips") },
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

    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new ConvexError("Trip not found or unauthorized");
    }

    if (trip.status !== "active") {
      throw new ConvexError("Trip is already completed");
    }

    await ctx.db.patch(trip._id, {
      status: "safe",
      safetyCheckTokenUsed: true,
    });

    const safetyCheck = await ctx.db
      .query("safetyChecks")
      .filter((q) => q.eq(q.field("tripId"), trip._id))
      .first();

    if (safetyCheck) {
      await ctx.db.patch(safetyCheck._id, {
        response: "yes",
        respondedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * MUTATION: Inserts a new background location snapshot during an active trip.
 */
export const addLocationSnapshot = mutation({
  args: {
    tripId: v.id("trips"),
    encryptedLat: v.string(),
    encryptedLng: v.string(),
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

    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new ConvexError("Trip not found or unauthorized");
    }

    if (trip.status !== "active") {
      throw new ConvexError("Location snapshots can only be logged for active trips");
    }

    const snapshotId = await ctx.db.insert("locationSnapshots", {
      tripId: args.tripId,
      encryptedLat: args.encryptedLat,
      encryptedLng: args.encryptedLng,
      capturedAt: Date.now(),
    });

    return snapshotId;
  },
});

/**
 * MUTATION: Reads location snapshots for a trip.
 */
export const readLocationSnapshots = mutation({
  args: { tripId: v.id("trips") },
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

    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new ConvexError("Trip not found or unauthorized");
    }

    // 1. Log sensitive GPS data access
    await ctx.db.insert("dataAccessLogs", {
      userId: identity.subject,
      action: "read_location_snapshots",
      resourceType: "locationSnapshots",
      resourceId: args.tripId,
      timestamp: Date.now(),
    });

    // 2. Fetch snapshots
    return await ctx.db
      .query("locationSnapshots")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

/**
 * PUBLIC MUTATION: Used by safety-check route.
 */
export const readLocationSnapshotsPublic = mutation({
  args: {
    tripId: v.id("trips"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    await ctx.db.insert("dataAccessLogs", {
      userId: `public_contact_${trip.safetyContactId}`,
      action: "read_location_snapshots_public",
      resourceType: "locationSnapshots",
      resourceId: args.tripId,
      timestamp: Date.now(),
    });

    return await ctx.db
      .query("locationSnapshots")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

/**
 * MUTATION: Submit the post-ride survey feedback.
 * Registers anonymous vehicle reports if commuter reports concern.
 */
export const submitPostRideSurvey = mutation({
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

    if (trip.postRideAnswered) {
      throw new ConvexError("Survey already submitted for this trip");
    }

    let sanitizedIncidentType = args.incidentType;
    if (args.response === "felt-off") {
      const typeInput = args.incidentType || "general-concern";
      const parsedType = incidentTypeSchema.safeParse(typeInput);
      if (!parsedType.success) {
        throw new ConvexError(parsedType.error.issues[0].message);
      }
      sanitizedIncidentType = parsedType.data;
    }

    // 1. Insert into postRideSurveys
    await ctx.db.insert("postRideSurveys", {
      tripId: args.tripId,
      userId: user._id,
      response: args.response,
      incidentType: sanitizedIncidentType,
      submittedAt: Date.now(),
    });

    // 2. Mark trip as answered
    await ctx.db.patch(trip._id, {
      postRideAnswered: true,
    });

    // 3. Handle incident creation and vehicle flag increments if felt-off
    if (args.response === "felt-off") {
      // Create incident (anonymous: no userId field is stored in incidents table)
      await ctx.db.insert("incidents", {
        tripId: trip._id,
        plate: trip.plate,
        incidentType: sanitizedIncidentType || "general-concern",
        source: "post-ride-survey",
        status: "pending-review",
        createdAt: Date.now(),
      });

      // Update vehicle flags
      const vehicle = await ctx.db
        .query("vehicles")
        .withIndex("by_plate", (q) => q.eq("plate", trip.plate))
        .unique();

      if (vehicle) {
        const flagCount = vehicle.flagCount + 1;
        
        // Safety Indicator categorization logic
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
        // Create vehicle record
        await ctx.db.insert("vehicles", {
          plate: trip.plate,
          transportType: trip.transportType,
          description: "Reported via commuter post-ride survey",
          flagCount: 1,
          safetyIndicator: "yellow",
          dangerousStatus: false,
          lastFlaggedAt: Date.now(),
        });
      }

      await notifySavers(ctx, trip.plate, sanitizedIncidentType || "felt-off concern");
    }

    return { success: true };
  },
});

/**
 * QUERY: Fetches the last completed trip that hasn't had its survey answered.
 */
export const getLastUnansweredTrip = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const lastTrip = await ctx.db
      .query("trips")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (lastTrip && lastTrip.status !== "active" && !lastTrip.postRideAnswered) {
      return lastTrip;
    }

    return null;
  },
});
