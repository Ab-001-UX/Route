import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
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

  // 2. Enforce Upstash Rate Limiting (10 trips per hour per user)
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
      description,
    } = body;

    if (!plate || !transportType || !boardingLocation || !destination) {
      return NextResponse.json(
        { success: false, message: "Missing required trip fields." },
        { status: 400 }
      );
    }

    const clerkToken = await authObj.getToken({ template: "convex" });
    if (clerkToken) {
      convex.setAuth(clerkToken);
    }

    // 3. Call Convex Mutation to write the Trip
    const result = await convex.mutation(api.trips.createTrip, {
      plate,
      transportType,
      boardingLocation,
      destination,
      description,
    });

    return NextResponse.json({
      success: true,
      data: {
        tripId: result.tripId,
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
