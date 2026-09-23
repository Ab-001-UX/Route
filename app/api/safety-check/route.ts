import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Safety check tokens are deprecated. Route v2 displays public trip details directly at /trip/[id]." 
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Safety check responses are deprecated in Route v2." 
    },
    { status: 410 }
  );
}
