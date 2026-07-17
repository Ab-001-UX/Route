import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { checkRateLimit } from "@/lib/upstash";
import { sanitizeLog } from "@/lib/validators";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  // 1. Authenticate Admin Gating
  const authObj = await auth();
  const { userId } = authObj;
  
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized access." },
      { status: 401 }
    );
  }

  const adminClerkId = process.env.ADMIN_CLERK_ID;
  if (!adminClerkId || userId !== adminClerkId) {
    return NextResponse.json(
      { success: false, message: "Forbidden: Admin access only." },
      { status: 403 }
    );
  }

  // 2. Enforce Upstash Rate Limiting (5 exports per hour per admin)
  const rateLimit = await checkRateLimit(userId, "admin_csv_export", 5, 3600);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, message: "Rate limit exceeded. Maximum 5 exports per hour allowed." },
      { status: 429 }
    );
  }

  try {
    // Authenticate the Convex client for this request context
    const clerkToken = await authObj.getToken({ template: "convex" });
    if (clerkToken) {
      convex.setAuth(clerkToken);
    }

    // 3. Query the fully anonymized dataset from Convex
    const dataset = await convex.query(api.admin.getExportDataset);

    // 4. Construct CSV Content
    const headers = [
      "Trip ID Hash",
      "Anonymized Plate Hash",
      "Transport Type",
      "Boarding Location",
      "Status",
      "Incident Count",
      "Incident Summary",
      "Created At"
    ];

    const csvRows = [headers.join(",")];

    for (const item of dataset) {
      const row = [
        `"${item.tripIdHash}"`,
        `"${item.anonymizedPlateHash}"`,
        `"${item.transportType.replace(/"/g, '""')}"`,
        `"${item.boardingLocation.replace(/"/g, '""')}"`,
        `"${item.status}"`,
        item.incidentCount,
        `"${item.incidentSummary.replace(/"/g, '""')}"`,
        `"${item.createdAt}"`
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");

    // 5. Return Response as CSV file download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=route_anonymized_trips_${Date.now()}.csv`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Admin CSV Export API error:", sanitizeLog(err?.message || err));
    return NextResponse.json(
      { success: false, message: err.message || "Failed to generate CSV export." },
      { status: 500 }
    );
  }
}
