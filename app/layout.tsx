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
          <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
            <path d="M20 80 C 20 20, 80 20, 80 80" stroke="#111111" strokeWidth="12" strokeLinecap="round" />
            <path d="M20 80 C 20 20, 80 20, 80 80" stroke="#ffffff" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />
          </svg>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
