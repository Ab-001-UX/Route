import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { checkRateLimit } from "@/lib/upstash";
import { plateSchema, sanitizeLog } from "@/lib/validators";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  // 1. Authenticate Request
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized access." },
      { status: 401 }
    );
  }

  // 2. Enforce Rate Limit (30 searches per user per hour)
  const rateLimit = await checkRateLimit(userId, "plate_search", 30, 3600);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, message: "Rate limit exceeded. Max 30 searches per hour." },
      { status: 429 }
    );
  }

  // 3. Extract and Validate Plate Number
  const { searchParams } = new URL(req.url);
  const plateParam = searchParams.get("plate");

  if (!plateParam) {
    return NextResponse.json(
      { success: false, message: "Plate number query parameter is required." },
      { status: 400 }
    );
  }

  const validatedPlate = plateSchema.safeParse(plateParam);
  if (!validatedPlate.success) {
    return NextResponse.json(
      { success: false, message: validatedPlate.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    // 4. Query Convex
    const result = await convex.query(api.vehicles.getVehicleByPlate, {
      plate: validatedPlate.data,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Vehicle search API error:", sanitizeLog(err?.message || err));
    return NextResponse.json(
      { success: false, message: err.message || "Failed to search vehicle." },
      { status: 500 }
    );
  }
}
