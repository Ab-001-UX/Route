import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/welcome(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/contact-activation/(.*)",
  "/api/contact-activation(.*)",
  "/safety-check/(.*)",
  "/api/safety-check(.*)",
  "/privacy(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html|css|js|gif|svg|png|webp|jpg|jpeg|webp|ico|csv|docx|xlsx|zip|webmanifest)).*)",
    // Run for API routes
    "/(api|trpc)(.*)",
  ],
};
