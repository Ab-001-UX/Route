import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { checkRateLimit } from "@/lib/upstash";
import { sanitizeLog } from "@/lib/validators";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  // 1. Authenticate Request
  const authObj = await auth();
  const { userId } = authObj;
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized access." },
      { status: 401 }
    );
  }

  // 2. Enforce Rate Limit (100 requests per user per hour)
  const rateLimit = await checkRateLimit(userId, "saved_vehicles_lookup", 100, 3600);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, message: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  try {
    // 3. Authenticate the Convex Client using Clerk token
    const clerkToken = await authObj.getToken({ template: "convex" });
    if (clerkToken) {
      convex.setAuth(clerkToken);
    }

    // 4. Query Convex
    const result = await convex.query(api.vehicles.getSavedVehicles, {});

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Saved vehicles API error:", sanitizeLog(err?.message || err));
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch saved vehicles." },
      { status: 500 }
    );
  }
}
