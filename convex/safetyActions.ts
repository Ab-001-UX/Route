"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { sendPushNotification } from "../lib/fcm";
import { sanitizeLog } from "../lib/validators";

/**
 * Scheduled Action: Triggers the safety check-in prompt when the trip duration expires.
 * Fires the initial FCM push notification to the designated safety contact.
 */
export const triggerSafetyCheck = action({
  args: {
    tripId: v.id("trips"),
    plaintextToken: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Transition trip to pending-review in database
    const result = await ctx.runMutation(api.trips.transitionToPendingReview, {
      tripId: args.tripId,
    });

    if (!result || !result.safetyContact) return;

    // 2. Prepare Notification
    const { userName, plate, transportType, boardingLocation, safetyContact } = result;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkLink = `${appUrl}/safety-check/${args.plaintextToken}`;

    const payload = {
      title: "🚨 Route Safety Check-in",
      body: `Did ${userName} arrive safely? Please call or beep them before responding. This is a real safety tool — do not dismiss this.`,
      data: {
        tripId: args.tripId,
        userName,
        plate,
        transportType,
        boardingLocation,
        checkLink,
      },
    };

    // 3. Send Push Notification to safety contact
    if (safetyContact.encryptedFcmToken) {
      try {
        await sendPushNotification(safetyContact.encryptedFcmToken, payload);
      } catch (err) {
        console.error("FCM safety check trigger failed:", sanitizeLog(err));
      }
    }

    // 4. Schedule the first retry 10 minutes later
    await ctx.scheduler.runAfter(10 * 60 * 1000, api.safetyActions.triggerSafetyCheckRetry, {
      tripId: args.tripId,
      plaintextToken: args.plaintextToken,
      attempt: 1,
    });
  },
});

/**
 * Scheduled Action: Retries the safety check-in up to 3 times (10-minute intervals).
 * If the contact fails to respond after 3 retries, marks them unresponsive for this trip.
 */
export const triggerSafetyCheckRetry = action({
  args: {
    tripId: v.id("trips"),
    plaintextToken: v.string(),
    attempt: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Query trip metadata using system-level helper (as mutation to log data access)
    const trip = await ctx.runMutation(api.trips.getTripStatusForRetry, {
      tripId: args.tripId,
    });

    if (!trip || trip.status !== "pending-review" || trip.safetyCheckTokenUsed) {
      // Contact has responded or user clicked Safe
      return;
    }

    // 2. Increment database retry count
    await ctx.runMutation(api.trips.recordRetryAttempt, {
      tripId: args.tripId,
      retryCount: args.attempt,
    });

    // 3. Send Warning push reminder
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkLink = `${appUrl}/safety-check/${args.plaintextToken}`;

    const payload = {
      title: `⚠️ Urgent Check-in Reminder (Attempt ${args.attempt}/3)`,
      body: `Reminder: Did ${trip.userName} arrive safely? Please call them before responding.`,
      data: {
        tripId: args.tripId,
        userName: trip.userName,
        plate: trip.plate,
        checkLink,
      },
    };

    if (trip.safetyContact && trip.safetyContact.encryptedFcmToken) {
      try {
        await sendPushNotification(trip.safetyContact.encryptedFcmToken, payload);
      } catch (err) {
        console.error(`FCM retry ${args.attempt} failed:`, sanitizeLog(err));
      }
    }

    // 4. Reschedule or Mark Unresponsive
    if (args.attempt < 3) {
      await ctx.scheduler.runAfter(10 * 60 * 1000, api.safetyActions.triggerSafetyCheckRetry, {
        tripId: args.tripId,
        plaintextToken: args.plaintextToken,
        attempt: args.attempt + 1,
      });
    } else {
      // 3 retries completed with no answer: escalate contact to unresponsive
      await ctx.runMutation(api.trips.markContactUnresponsive, {
        tripId: args.tripId,
      });
    }
  },
});
