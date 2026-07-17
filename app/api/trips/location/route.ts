import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { encrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/upstash";
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

  try {
    const body = await req.json();
    const { tripId, lat, lng } = body;

    if (!tripId || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing required location snapshot fields." },
        { status: 400 }
      );
    }

    // 2. Enforce Upstash Rate Limiting
    // Standard limit: 120 snapshot logs per hour per user (highly sufficient for 2-minute updates)
    const rateLimit = await checkRateLimit(userId, "location_logging", 120, 3600);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: "Rate limit exceeded. Snapshot logging is restricted." },
        { status: 429 }
      );
    }

    // 3. Encrypt coordinates
    const encryptedLat = encrypt(lat.toString());
    const encryptedLng = encrypt(lng.toString());

    // Authenticate the Convex Client
    const clerkToken = await authObj.getToken({ template: "convex" });
    if (clerkToken) {
      convex.setAuth(clerkToken);
    }

    // 4. Call Convex Mutation to store location snapshot
    await convex.mutation(api.trips.addLocationSnapshot, {
      tripId,
      encryptedLat,
      encryptedLng,
    });

    return NextResponse.json({ success: true, message: "Location snapshot logged successfully." });
  } catch (err: any) {
    console.error("Location snapshot API error:", sanitizeLog(err?.message || err));
    return NextResponse.json(
      { success: false, message: err.message || "Failed to log location snapshot." },
      { status: 500 }
    );
  }
}
