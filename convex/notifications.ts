import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

/**
 * PUBLIC QUERY: Fetches notifications for the authenticated user.
 */
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const list = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // Sort by createdAt descending
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * MUTATION: Marks all notifications of the logged-in user as read.
 */
export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
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

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    for (const notif of unread) {
      await ctx.db.patch(notif._id, { isRead: true });
    }

    return { success: true };
  },
});

/**
 * MUTATION: Deletes a specific notification after ownership check.
 */
export const clearNotification = mutation({
  args: { id: v.id("notifications") },
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

    const notification = await ctx.db.get(args.id);
    if (!notification) {
      throw new ConvexError("Notification not found");
    }

    if (notification.userId !== user._id) {
      throw new ConvexError("Unauthorized to clear this notification");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
