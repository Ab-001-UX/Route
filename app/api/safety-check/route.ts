import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { hashToken } from "@/lib/tokens";
import { decrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/upstash";
import { sanitizeLog } from "@/lib/validators";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET: Validates the token and retrieves public trip details.
 * If status is incident-triggered, retrieves and decrypts location snapshots.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  
  // Rate limit: 15 token lookups per IP per minute
  const rateLimit = await checkRateLimit(ip, "safety_check_lookup", 15, 60);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get("token");

  if (!tokenParam) {
    return NextResponse.json(
      { success: false, message: "Not found." },
      { status: 404 }
    );
  }

  try {
    const tokenHash = await hashToken(tokenParam);
    const trip = await convex.query(api.trips.getTripPublic, {
      tokenHash,
    });

    if (!trip || trip.safetyCheckTokenExpiresAt < Date.now()) {
      // Return generic 404 for security: never disclose if it was invalid ID, token, or expired
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }

    if (trip.safetyCheckTokenUsed && trip.status !== "incident-triggered") {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }

    // If there is an emergency, return decrypted location snapshots and boarding GPS
    let snapshots: any[] = [];
    let boardingGPS: any = null;
    if (trip.status === "incident-triggered") {
      const encryptedSnapshots = await convex.mutation(api.trips.readLocationSnapshotsPublic, {
        tripId: trip._id,
        token: tokenParam,
      });

      snapshots = encryptedSnapshots.map((snap: any) => {
        try {
          return {
            lat: parseFloat(decrypt(snap.encryptedLat)),
            lng: parseFloat(decrypt(snap.encryptedLng)),
            capturedAt: snap.capturedAt,
          };
        } catch (decErr) {
          console.error("GPS decryption failed for snapshot:", sanitizeLog(decErr));
          return null;
        }
      }).filter(Boolean);

      try {
        boardingGPS = {
          lat: parseFloat(decrypt(trip.boardingGPS.encryptedLat)),
          lng: parseFloat(decrypt(trip.boardingGPS.encryptedLng)),
        };
      } catch (decErr) {
        console.error("GPS decryption failed for boarding GPS:", sanitizeLog(decErr));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        plate: trip.plate,
        transportType: trip.transportType,
        boardingLocation: trip.boardingLocation,
        destination: trip.destination,
        description: trip.description,
        status: trip.status,
        safetyCheckTokenUsed: trip.safetyCheckTokenUsed,
        userName: trip.userName,
        trafficRecheckCount: trip.trafficRecheckCount,
        flagCount: trip.flagCount,
        snapshots,
        boardingGPS,
      },
    });
  } catch (err: any) {
    console.error("Public check-in GET error:", sanitizeLog(err?.message || err));
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  }
}

/**
 * POST: Submits the safety check response (yes, no, stuck-in-traffic, maybe) from the contact.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  
  // Rate limit: 10 responses per IP per minute
  const rateLimit = await checkRateLimit(ip, "safety_check_response", 10, 60);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, message: "Too many submission attempts. Please wait." },
      { status: 429 }
    );
  }

  // Size limit check: 50KB maximum
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 50 * 1024) {
    return NextResponse.json(
      { success: false, message: "Payload size limit exceeded." },
      { status: 413 }
    );
  }

  try {
    const body = await req.json();
    const { token, response, honeypot } = body;

    // Honeypot check for bots
    if (honeypot) {
      console.warn("Honeypot filled. Silently rejecting safety check submission.");
      return NextResponse.json({ success: true, data: { status: "safe", safetyCheckTokenUsed: true } });
    }

    if (!token || !response) {
      return NextResponse.json(
        { success: false, message: "Not found." },
        { status: 404 }
      );
    }

    // Verify token hash is valid first
    const tokenHash = await hashToken(token);
    const trip = await convex.query(api.trips.getTripPublic, {
      tokenHash,
    });

    if (!trip || trip.safetyCheckTokenExpiresAt < Date.now() || trip.safetyCheckTokenUsed) {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }

    // Call Convex mutation to record response
    const result = await convex.mutation(api.trips.recordSafetyCheckResponse, {
      tripId: trip._id,
      response,
      plaintextToken: token,
    });

    let snapshots: any[] = [];
    let boardingGPS: any = null;
    // If contact responded NO (Emergency), return decrypted location snapshots and boarding GPS
    if (response === "no") {
      const encryptedSnapshots = await convex.mutation(api.trips.readLocationSnapshotsPublic, {
        tripId: trip._id,
        token,
      });

      snapshots = encryptedSnapshots.map((snap: any) => {
        try {
          return {
            lat: parseFloat(decrypt(snap.encryptedLat)),
            lng: parseFloat(decrypt(snap.encryptedLng)),
            capturedAt: snap.capturedAt,
          };
        } catch (decErr) {
          console.error("GPS decryption failed during emergency POST:", sanitizeLog(decErr));
          return null;
        }
      }).filter(Boolean);

      try {
        boardingGPS = {
          lat: parseFloat(decrypt(trip.boardingGPS.encryptedLat)),
          lng: parseFloat(decrypt(trip.boardingGPS.encryptedLng)),
        };
      } catch (decErr) {
        console.error("GPS decryption failed for boarding GPS:", sanitizeLog(decErr));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        option: result.option,
        userName: result.userName,
        newTimerExpiry: result.newTimerExpiry,
        recheckCount: result.recheckCount,
        snapshots,
        boardingGPS,
      },
    });
  } catch (err: any) {
    console.error("Public check-in POST error:", sanitizeLog(err?.message || err));
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  }
}
