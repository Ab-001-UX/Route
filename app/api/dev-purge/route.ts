// Deprecated — CSS purge route removed.
export async function GET() {
  return new Response(JSON.stringify({ success: false, message: "This endpoint has been removed." }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
}
