import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    phone: v.string(),
    displayName: v.optional(v.string()),
    contributorStatus: v.boolean(),
    tripCountToday: v.number(),
    theme: v.optional(v.string()),
    fontSize: v.optional(v.string()),
    privacyMode: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_phone", ["phone"]),

  contacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    relationship: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    inviteTokenHash: v.string(),
    inviteTokenExpiresAt: v.number(),
    encryptedFcmToken: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("unresponsive"),
      v.literal("removed")
    ),
    missedCheckIns: v.number(),
    responseRate: v.number(),
    avgResponseTime: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_inviteTokenHash", ["inviteTokenHash"]),

  trips: defineTable({
    userId: v.id("users"),
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
    safetyCheckTokenUsed: v.boolean(),
    status: v.union(
      v.literal("active"),
      v.literal("safe"),
      v.literal("pending-review"),
      v.literal("incident-triggered"),
      v.literal("resolved")
    ),
    postRideAnswered: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_plate", ["plate"])
    .index("by_safetyCheckTokenHash", ["safetyCheckTokenHash"]),

  locationSnapshots: defineTable({
    tripId: v.id("trips"),
    encryptedLat: v.string(),
    encryptedLng: v.string(),
    capturedAt: v.number(),
  })
    .index("by_tripId", ["tripId"]),

  safetyChecks: defineTable({
    tripId: v.id("trips"),
    contactId: v.id("contacts"),
    response: v.union(
      v.literal("yes"),
      v.literal("no"),
      v.literal("stuck-in-traffic"),
      v.null()
    ),
    trafficRecheckCount: v.number(),
    retryCount: v.number(),
    respondedAt: v.optional(v.number()),
    followUpSent: v.boolean(),
    followUpResponse: v.union(
      v.literal("reached"),
      v.literal("not-reached"),
      v.null()
    ),
  }),

  vehicles: defineTable({
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
    lastFlaggedAt: v.number(),
    lastFlaggedLocation: v.optional(
      v.object({
        encryptedLat: v.string(),
        encryptedLng: v.string(),
      })
    ),
  })
    .index("by_plate", ["plate"]),

  incidents: defineTable({
    tripId: v.optional(v.id("trips")),
    plate: v.string(),
    incidentType: v.string(),
    source: v.union(
      v.literal("contact-no"),
      v.literal("missed-check"),
      v.literal("post-ride-survey"),
      v.literal("anonymous-report")
    ),
    status: v.union(
      v.literal("pending-review"),
      v.literal("verified-concern"),
      v.literal("resolved")
    ),
    vehicleType: v.optional(v.string()),
    location: v.optional(v.string()),
    time: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_plate", ["plate"]),

  postRideSurveys: defineTable({
    tripId: v.id("trips"),
    userId: v.id("users"),
    response: v.union(v.literal("smooth"), v.literal("felt-off")),
    incidentType: v.optional(v.string()),
    submittedAt: v.number(),
  })
    .index("by_tripId", ["tripId"]),

  savedVehicles: defineTable({
    userId: v.id("users"),
    plate: v.string(),
    pinned: v.optional(v.boolean()),
    savedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_pinned", ["userId", "pinned"])
    .index("by_userId_plate", ["userId", "plate"])
    .index("by_plate", ["plate"]),

  contributions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(v.literal("voluntary"), v.literal("monthly-tier")),
    tierUnlocked: v.boolean(),
    createdAt: v.number(),
  }),

  adminLogs: defineTable({
    adminClerkId: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    timestamp: v.number(),
  }),

  dataAccessLogs: defineTable({
    userId: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    timestamp: v.number(),
  }),

  notifications: defineTable({
    userId: v.id("users"),
    plate: v.string(),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),
});
