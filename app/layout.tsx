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
      <body>
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
