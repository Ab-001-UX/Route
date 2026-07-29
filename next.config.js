/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://challenges.cloudflare.com; connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://fcm.googleapis.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://us.i.posthog.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://challenges.cloudflare.com https://img.clerk.com https://images.clerk.dev; img-src 'self' data: blob: https://img.clerk.com https://*.clerk.accounts.dev https://images.clerk.dev https://lh3.googleusercontent.com https://images.unsplash.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; worker-src 'self' blob:; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com; connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://fcm.googleapis.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://us.i.posthog.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://challenges.cloudflare.com https://img.clerk.com https://images.clerk.dev; img-src 'self' data: blob: https://img.clerk.com https://*.clerk.accounts.dev https://images.clerk.dev https://lh3.googleusercontent.com https://images.unsplash.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; worker-src 'self' blob:; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
