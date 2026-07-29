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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function showErrorOverlay(title, msg, stack) {
                  try {
                    var existing = document.getElementById('on-device-error-overlay');
                    if (existing) existing.remove();

                    var overlay = document.createElement('div');
                    overlay.id = 'on-device-error-overlay';
                    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:#0d0000;color:#ff6b6b;z-index:9999999;padding:20px;box-sizing:border-box;overflow:auto;font-family:monospace;font-size:12px;line-height:1.5;word-break:break-all;';

                    var header = document.createElement('h3');
                    header.style.cssText = 'color:#ff4d4d;margin:0 0 10px 0;font-size:15px;border-bottom:1px solid #ff4d4d;padding-bottom:6px;';
                    header.innerText = '🚨 REAL CRASH DEBUGGER: ' + title;

                    var body = document.createElement('div');
                    body.style.cssText = 'white-space:pre-wrap;background:#1a0000;padding:12px;border-radius:8px;border:1px solid #880000;color:#ffffff;font-size:11px;';
                    body.innerText = (msg || 'Unknown Error') + (stack ? '\\n\\n--- STACK TRACE ---\\n' + stack : '');

                    var closeBtn = document.createElement('button');
                    closeBtn.style.cssText = 'margin-top:14px;padding:8px 16px;background:#ff4d4d;color:#fff;border:none;border-radius:6px;font-weight:bold;font-size:13px;cursor:pointer;';
                    closeBtn.innerText = 'Dismiss Overlay';
                    closeBtn.onclick = function() { overlay.remove(); };

                    overlay.appendChild(header);
                    overlay.appendChild(body);
                    overlay.appendChild(closeBtn);

                    if (document.body) {
                      document.body.appendChild(overlay);
                    } else {
                      window.addEventListener('DOMContentLoaded', function() { document.body.appendChild(overlay); });
                    }
                  } catch (e) {
                    console.error('Error rendering overlay', e);
                  }
                }

                window.onerror = function(message, source, lineno, colno, error) {
                  var msgStr = String(message || '');
                  if (msgStr.indexOf('ChunkLoadError') !== -1 || msgStr.indexOf('Loading chunk') !== -1) {
                    window.location.reload(true);
                    return true;
                  }
                  var stack = (error && error.stack) ? error.stack : (source + ':' + lineno + ':' + colno);
                  showErrorOverlay('RUNTIME ERROR', message, stack);
                  return false;
                };

                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event.reason;
                  var msg = (reason && reason.message) ? reason.message : String(reason);
                  if (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1) {
                    window.location.reload(true);
                    return;
                  }
                  var stack = (reason && reason.stack) ? reason.stack : '';
                  showErrorOverlay('UNHANDLED PROMISE REJECTION', msg, stack);
                });

                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var i = 0; i < regs.length; i++) { regs[i].unregister(); }
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var i = 0; i < names.length; i++) { caches.delete(names[i]); }
                  });
                }
              })();
            `,
          }}
        />
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
              window.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                  var splash = document.getElementById('app-startup-splash');
                  if (splash) {
                    splash.style.opacity = '0';
                    splash.style.visibility = 'hidden';
                    setTimeout(function() { splash.style.display = 'none'; }, 300);
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
