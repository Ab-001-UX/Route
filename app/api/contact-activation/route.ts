import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Contact activation is no longer required. Route v2 lets users share trip summaries directly via WhatsApp." 
    },
    { status: 410 }
  );
}
