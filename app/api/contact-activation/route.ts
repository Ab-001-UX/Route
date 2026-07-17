import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { encrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/upstash";
import { sanitizeLog } from "@/lib/validators";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  // 1. Get Client IP for Rate Limiting
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  
  // 2. Enforce Rate Limit (10 requests per IP per minute)
  const rateLimit = await checkRateLimit(ip, "contact_activation", 10, 60);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, message: "Too many activation requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  // 3. Size Limit check (50KB maximum)
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 50 * 1024) {
    return NextResponse.json(
      { success: false, message: "Payload size limit exceeded." },
      { status: 413 }
    );
  }

  try {
    const body = await req.json();
    const { token, fcmToken, honeypot } = body;

    // 4. Honeypot check (Bot detection)
    if (honeypot) {
      // Silently reject by returning success: true but doing nothing
      console.warn("Honeypot field filled. Bot detected, silently rejecting.");
      return NextResponse.json({ success: true, message: "Activated successfully" });
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not found." },
        { status: 404 }
      );
    }

    // 5. Encrypt FCM Token at rest
    let encryptedFcmToken: string | undefined;
    if (fcmToken) {
      encryptedFcmToken = encrypt(fcmToken);
    }

    // 6. Call Convex Mutation to activate contact
    const result = await convex.mutation(api.contacts.activateContact, {
      token,
      encryptedFcmToken,
    });

    if (!result || !result.success) {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Activated successfully" });
  } catch (err: any) {
    console.error("Contact activation API error:", sanitizeLog(err?.message || err));
    // Return standard generic 404 response
    return NextResponse.json(
      { success: false, message: "Not found." },
      { status: 404 }
    );
  }
}
