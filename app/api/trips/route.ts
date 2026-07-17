import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { encrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/upstash";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendPushNotification } from "@/lib/fcm";
import { sanitizeLog } from "@/lib/validators";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  // 1. Authenticate Request
  const authObj = await auth();
  const { userId } = authObj;
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized access." },
      { status: 401 }
    );
  }

  // 2. Enforce Upstash Rate Limiting
  // Limit to 10 trip logs per hour per user to prevent API spam
  const rateLimit = await checkRateLimit(userId, "trip_logging", 10, 3600);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, message: "Rate limit exceeded. Please wait before logging another trip." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      plate,
      transportType,
      boardingLocation,
      destination,
      lat,
      lng,
      durationMinutes,
      safetyContactId,
      alertContactIds,
      description, // Optional vehicle description details
    } = body;

    // Validate required fields
    if (
      !plate ||
      !transportType ||
      !boardingLocation ||
      !destination ||
      lat === undefined ||
      lng === undefined ||
      !durationMinutes ||
      !safetyContactId ||
      !alertContactIds ||
      !Array.isArray(alertContactIds)
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required trip fields." },
        { status: 400 }
      );
    }

    // 3. Encrypt Boarding GPS coordinates
    const encryptedLat = encrypt(lat.toString());
    const encryptedLng = encrypt(lng.toString());

    // 4. Generate Cryptographically Secure Safety Check Token (HMAC-SHA256)
    const plaintextToken = generateToken();
    const safetyCheckTokenHash = await hashToken(plaintextToken);
    const safetyCheckTokenExpiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48 hours

    const timerExpiry = Date.now() + durationMinutes * 60 * 1000;

    // Authenticate the Convex Client using Clerk token so Convex can execute mutations with identity
    const clerkToken = await authObj.getToken({ template: "convex" });
    if (clerkToken) {
      convex.setAuth(clerkToken);
    }

    // 5. Call Convex Mutation to write the Trip and log access
    const result = await convex.mutation(api.trips.createTrip, {
      plate,
      transportType,
      boardingLocation,
      destination,
      description,
      boardingGPS: { encryptedLat, encryptedLng },
      timerExpiry,
      safetyContactId,
      alertContactIds,
      safetyCheckTokenHash,
      safetyCheckTokenExpiresAt,
      plaintextToken,
    });

    const { tripId, userName, alertContacts } = result;

    // 6. Fire FCM Push Notifications to Alert Contacts
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const trackingLink = `${appUrl}/safety-check/${plaintextToken}`;
    const vehicleDescText = description ? ` (${description})` : "";
    
    const notificationPayload = {
      title: "🚨 Route Safety Alert",
      body: `${userName} has boarded a ${transportType}${vehicleDescText}. Plate: ${plate}. Boarding: ${boardingLocation}. Live GPS link: ${trackingLink}`,
      data: {
        tripId,
        userName,
        plate,
        transportType,
        boardingLocation,
        trackingLink,
      },
    };

    // Send to each alert contact
    for (const contact of alertContacts) {
      if (contact.encryptedFcmToken) {
        try {
          await sendPushNotification(contact.encryptedFcmToken, notificationPayload);
        } catch (fcmErr) {
          console.error(`FCM sending failed for contact ${sanitizeLog(contact.name)}:`, sanitizeLog(fcmErr));
          // Don't fail the whole request if one push notification fails
        }
      }
    }

    // Return trip details including the plaintext token so the client can save or share it
    return NextResponse.json({
      success: true,
      data: {
        tripId,
        plaintextToken,
        timerExpiry,
      },
    });
  } catch (err: any) {
    console.error("Trip logging API error:", sanitizeLog(err?.message || err));
    return NextResponse.json(
      { success: false, message: err.message || "Failed to log trip." },
      { status: 500 }
    );
  }
}
