import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    phone: v.optional(v.string()),
    displayName: v.optional(v.string()),
    contributorStatus: v.boolean(),
    tripCountToday: v.number(),
    theme: v.optional(v.string()),
    fontSize: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"]),

  trips: defineTable({
    userId: v.id("users"),
    plate: v.string(),
    transportType: v.string(),
    boardingLocation: v.string(),
    destination: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_plate", ["plate"]),

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
    lastFlaggedLocation: v.optional(v.string()),
  })
    .index("by_plate", ["plate"]),

  incidents: defineTable({
    tripId: v.optional(v.id("trips")),
    plate: v.string(),
    incidentType: v.string(),
    source: v.union(
      v.literal("anonymous-report"),
      v.literal("user-report")
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
});
