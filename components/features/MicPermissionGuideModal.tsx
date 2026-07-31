"use client";

import React, { useEffect, useState } from "react";
import { Mic, MapPin, ExternalLink, Settings, X } from "lucide-react";

const PRODUCTION_URL = "https://route-nine-dusky.vercel.app";

export type PermissionType = "microphone" | "location";
type OS = "ios" | "android" | "other";

function detectOS(): OS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

/** true when running as installed PWA from home screen; false when in a regular Safari tab */
function isStandaloneApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as any).standalone === true;
}

// ---------- Copy ----------

type StepNode = React.ReactNode;

interface Config {
  headline: string;
  body: string;
  // Steps when user is in the installed home screen app (needs to open Safari first)
  stepsFromApp: StepNode[];
  // Steps when user is already in a Safari tab (skip "Open in Safari")
  stepsFromSafari: StepNode[];
  primaryLabel: string;
}

const copy: Record<PermissionType, Record<"ios" | "android", Config>> = {
  microphone: {
    ios: {
      headline: "Let's turn on your microphone",
      body: "Route needs microphone access so you can search for a vehicle plate by voice instead of typing. This has to be turned on through Safari — it's an iPhone rule for all apps like Route, not something we can skip.",
      stepsFromApp: [
        <>Tap <strong>"Open in Safari"</strong> below. This will open Route inside your Safari browser.</>,
        <>Look for the letters <strong>"Aa"</strong> next to the address bar. Tap them.</>,
        <>A menu will appear. Tap <strong>"Website Settings"</strong>.</>,
        <>Find <strong>Microphone</strong> on the list. Tap it and choose <strong>Allow</strong>.</>,
        <>Tap <strong>Done</strong>, then come back to Route from your home screen icon. Your microphone will now work.</>,
      ],
      stepsFromSafari: [
        <>Look for the letters <strong>"Aa"</strong> next to the address bar above. Tap them.</>,
        <>A menu will appear. Tap <strong>"Website Settings"</strong>.</>,
        <>Find <strong>Microphone</strong> on the list. Tap it and choose <strong>Allow</strong>.</>,
        <>Tap <strong>Done</strong>. Your microphone will work straight away — no need to reload.</>,
      ],
      primaryLabel: "Open in Safari",
    },
    android: {
      headline: "Let's turn on your microphone",
      body: "Route needs this to work properly. It only takes a few taps.",
      stepsFromApp: [
        <>Press and hold the <strong>Route</strong> app icon on your home screen.</>,
        <>Tap <strong>App info</strong>.</>,
        <>Tap <strong>Permissions</strong>.</>,
        <>Find <strong>Microphone</strong> and choose <strong>Allow</strong>.</>,
        <>Go back to Route — it'll work right away, no need to reopen the app.</>,
      ],
      stepsFromSafari: [
        <>Press and hold the <strong>Route</strong> app icon on your home screen.</>,
        <>Tap <strong>App info</strong>.</>,
        <>Tap <strong>Permissions</strong>.</>,
        <>Find <strong>Microphone</strong> and choose <strong>Allow</strong>.</>,
        <>Go back to Route — it'll work right away, no need to reopen the app.</>,
      ],
      primaryLabel: "Open App Settings",
    },
  },
  location: {
    ios: {
      headline: "Let's turn on your location",
      body: "Route needs your location to show nearby safety alerts and track your commute in real time. This has to be turned on through Safari — it's an iPhone rule for all apps like Route, not something we can skip.",
      stepsFromApp: [
        <>Tap <strong>"Open in Safari"</strong> below. This will open Route inside your Safari browser.</>,
        <>Look for the letters <strong>"Aa"</strong> next to the address bar. Tap them.</>,
        <>A menu will appear. Tap <strong>"Website Settings"</strong>.</>,
        <>Find <strong>Location</strong> on the list. Tap it and choose <strong>Allow</strong>.</>,
        <>Tap <strong>Done</strong>, then come back to Route from your home screen icon. Your location will now work.</>,
      ],
      stepsFromSafari: [
        <>Look for the letters <strong>"Aa"</strong> next to the address bar above. Tap them.</>,
        <>A menu will appear. Tap <strong>"Website Settings"</strong>.</>,
        <>Find <strong>Location</strong> on the list. Tap it and choose <strong>Allow</strong>.</>,
        <>Tap <strong>Done</strong>. Your location will work straight away — no need to reload.</>,
      ],
      primaryLabel: "Open in Safari",
    },
    android: {
      headline: "Let's turn on your location",
      body: "Route needs this to work properly. It only takes a few taps.",
      stepsFromApp: [
        <>Press and hold the <strong>Route</strong> app icon on your home screen.</>,
        <>Tap <strong>App info</strong>.</>,
        <>Tap <strong>Permissions</strong>.</>,
        <>Find <strong>Location</strong> and choose <strong>Allow</strong>.</>,
        <>Go back to Route — it'll work right away, no need to reopen the app.</>,
      ],
      stepsFromSafari: [
        <>Press and hold the <strong>Route</strong> app icon on your home screen.</>,
        <>Tap <strong>App info</strong>.</>,
        <>Tap <strong>Permissions</strong>.</>,
        <>Find <strong>Location</strong> and choose <strong>Allow</strong>.</>,
        <>Go back to Route — it'll work right away, no need to reopen the app.</>,
      ],
      primaryLabel: "Open App Settings",
    },
  },
};

// ---------- Props ----------

export interface PermissionGuideModalProps {
  type: PermissionType;
  onDismiss: () => void;
  /** Unused — cancel is the X button. Kept for call-site compatibility. */
  dismissLabel?: string;
}

// ---------- Component ----------

export default function MicPermissionGuideModal({
  type,
  onDismiss,
}: PermissionGuideModalProps) {
  const [os, setOs] = useState<OS>("other");
  const [inSafariTab, setInSafariTab] = useState(false);

  useEffect(() => {
    const detectedOS = detectOS();
    setOs(detectedOS);
    // On iOS: standalone=false means the user IS in a regular Safari browser tab
    if (detectedOS === "ios") {
      setInSafariTab(!isStandaloneApp());
    }
  }, []);

  // Lock body scroll while modal is open — prevents the page scrolling underneath
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const config = os === "android"
    ? copy[type].android
    : copy[type].ios;

  const steps = inSafariTab ? config.stepsFromSafari : config.stepsFromApp;

  // Show "Open in Safari" button only when the user is in the home screen app (needs to switch to Safari)
  const showPrimaryBtn = os !== "android" && !inSafariTab;
  // On Android show the App Settings button regardless
  const showAndroidBtn = os === "android";

  const handlePrimary = () => {
    if (os === "android") {
      try {
        window.location.href =
          "intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=app.vercel.route_nine_dusky;end";
      } catch {
        /* noop */
      }
    } else {
      window.open(PRODUCTION_URL, "_blank");
    }
  };

  // Use the app's brand primary for both types — no hardcoded blue
  const accent = "var(--color-brand-primary, #6366f1)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Prevent touches on the outer wrapper from reaching the page
        touchAction: "none",
        padding: "16px",
      }}
    >
      {/* Backdrop — tap to dismiss */}
      <div
        role="button"
        aria-label="Close"
        onClick={onDismiss}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Centered Modal — touchAction: pan-y so only this scrolls */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          // Explicit background that will be clearly visible on any dark or light bg
          background: "var(--color-background-card, #1c1c2e)",
          borderRadius: "20px",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          // Fill up to 88% of the viewport height; internal sections scroll
          maxHeight: "88svh",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
        }}
      >
        {/* X close button */}
        <button
          onClick={onDismiss}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            zIndex: 10,
          }}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* ── Scrollable body ── */}
        <div
          style={{
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            padding: "24px 20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
            touchAction: "pan-y",
          }}
        >
          {/* Header: icon + headline + body */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {type === "microphone" ? (
                <Mic size={22} color="#ffffff" />
              ) : (
                <MapPin size={22} color="#ffffff" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: 700,
                  // Force high-contrast white — no CSS variable that might resolve dark
                  color: "#ffffff",
                  lineHeight: "1.25",
                }}
              >
                {config.headline}
              </h3>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.62)",
                  lineHeight: "1.6",
                }}
              >
                {config.body}
              </p>
            </div>
          </div>

          {/* If user is already in Safari, tell them they don't need to switch */}
          {inSafariTab && os === "ios" && (
            <div
              style={{
                background: "rgba(99,102,241,0.10)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "12.5px",
                color: "rgba(255,255,255,0.75)",
                lineHeight: "1.5",
              }}
            >
              You&apos;re already in Safari — no need to open it again. Just follow the steps below.
            </div>
          )}

          {/* Numbered steps */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            {steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "13px 14px",
                  borderBottom:
                    i < steps.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                }}
              >
                {/* Number badge */}
                <span
                  aria-hidden="true"
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: accent,
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: "13.5px",
                    color: "#ffffff",
                    lineHeight: "1.55",
                    flex: 1,
                  }}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* iOS home screen app: "Open in Safari" */}
            {showPrimaryBtn && (
              <button
                onClick={handlePrimary}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  background: accent,
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <ExternalLink size={17} />
                {config.primaryLabel}
              </button>
            )}

            {/* Android: "Open App Settings" */}
            {showAndroidBtn && (
              <button
                onClick={handlePrimary}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  background: accent,
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Settings size={17} />
                {config.primaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
