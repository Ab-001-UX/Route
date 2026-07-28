import type { Metadata, Viewport } from "next";
import { Montserrat, Manrope } from "next/font/google";
import "../tokens/theme.css";
import "../tokens/style.css";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import RegisterSW from "@/components/providers/RegisterSW";
import CookieConsent from "@/components/features/CookieConsent";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Route — Passive Safety PWA",
  description: "Lagos passive-safety Progressive Web App for commuters.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f8f7" },   // warm pearl near-white
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },    // near-black
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${manrope.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/route-logo.png" />
        <link rel="apple-touch-icon" href="/route-logo.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body style={{ backgroundColor: "#ffffff", margin: 0 }}>
        {/* Instant PWA Startup Splash Screen (renders in 50ms before client JS hydrates) */}
        <div
          id="app-startup-splash"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            transition: "opacity 0.25s ease-out, visibility 0.25s ease-out",
            pointerEvents: "none",
          }}
        >
          <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 28 82 C 24 55 24 35 34 22 C 46 8 72 8 82 22 C 92 36 86 52 70 58 C 55 64 36 60 36 60 C 36 60 52 74 68 82"
              stroke="#111111"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 28 82 C 24 55 24 35 34 22 C 46 8 72 8 82 22 C 92 36 86 52 70 58 C 55 64 36 60 36 60 C 36 60 52 74 68 82"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Auto-reload page automatically if opened during a Vercel server deployment swap
              window.addEventListener('error', function(e) {
                var msg = (e && e.message) ? e.message.toLowerCase() : '';
                if (msg.indexOf('loading chunk') !== -1 || msg.indexOf('failed to fetch') !== -1 || msg.indexOf('dynamically imported module') !== -1) {
                  var lastReload = sessionStorage.getItem('auto_deployment_reload');
                  if (!lastReload || (Date.now() - parseInt(lastReload, 10)) > 10000) {
                    sessionStorage.setItem('auto_deployment_reload', Date.now().toString());
                    window.location.reload();
                  }
                }
              }, true);

              window.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                  var splash = document.getElementById('app-startup-splash');
                  if (splash) {
                    splash.style.opacity = '0';
                    splash.style.visibility = 'hidden';
                    setTimeout(function() { splash.remove(); }, 300);
                  }
                }, 150);
              });
            `,
          }}
        />
        <ConvexClientProvider>
          <ThemeProvider>
            <RegisterSW />
            {children}
            <CookieConsent />
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
