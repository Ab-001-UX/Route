// Deprecated — OCR route removed.
export async function POST() {
  return new Response(JSON.stringify({ success: false, message: "This endpoint has been removed." }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
}
