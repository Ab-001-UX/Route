"use client";

import React, { useEffect, useState } from "react";
import { Mic, MapPin, ExternalLink, Settings } from "lucide-react";

const PRODUCTION_URL = "https://route-nine-dusky.vercel.app";

// --- Types ---

export type PermissionType = "microphone" | "location";
type OS = "ios" | "android" | "other";

function detectOS(): OS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

// --- Copy ---

const copy = {
  microphone: {
    ios: {
      headline: "Let's turn on your microphone",
      body: "Route needs microphone access so you can search for a vehicle plate by voice instead of typing. This has to be turned on through Safari — it's an iPhone rule for all apps like Route, not something we can skip.",
      steps: [
        <>Tap <strong>"Open in Safari"</strong> below. This will open Route inside your Safari browser.</>,
        <>Look at the top of the screen, next to the address bar. Tap the small letters <strong>"Aa"</strong>.</>,
        <>A menu will pop up. Tap <strong>"Website Settings"</strong>.</>,
        <>Find <strong>Microphone</strong> on the list. Tap it and choose <strong>Allow</strong>.</>,
        <>Close Safari and open Route from your home screen icon again. Your microphone will now work.</>,
      ],
      primaryLabel: "Open in Safari",
    },
    android: {
      headline: "Let's turn on your microphone",
      body: "Route needs this to work properly. It only takes a few taps.",
      steps: [
        <>Press and hold the Route app icon on your home screen.</>,
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
      steps: [
        <>Tap <strong>"Open in Safari"</strong> below. This will open Route inside your Safari browser.</>,
        <>Look at the top of the screen, next to the address bar. Tap the small letters <strong>"Aa"</strong>.</>,
        <>A menu will pop up. Tap <strong>"Website Settings"</strong>.</>,
        <>Find <strong>Location</strong> on the list. Tap it and choose <strong>Allow</strong>.</>,
        <>Close Safari and open Route from your home screen icon again. Your location will now work.</>,
      ],
      primaryLabel: "Open in Safari",
    },
    android: {
      headline: "Let's turn on your location",
      body: "Route needs this to work properly. It only takes a few taps.",
      steps: [
        <>Press and hold the Route app icon on your home screen.</>,
        <>Tap <strong>App info</strong>.</>,
        <>Tap <strong>Permissions</strong>.</>,
        <>Find <strong>Location</strong> and choose <strong>Allow</strong>.</>,
        <>Go back to Route — it'll work right away, no need to reopen the app.</>,
      ],
      primaryLabel: "Open App Settings",
    },
  },
} as const;

const accentColor: Record<PermissionType, string> = {
  microphone: "hsl(200, 95%, 53%)",
  location: "var(--color-brand-primary, hsl(234, 89%, 64%))",
};

const iconBg: Record<PermissionType, string> = {
  microphone: "rgba(56, 189, 248, 0.12)",
  location: "rgba(99, 102, 241, 0.12)",
};

// --- Component ---

export interface PermissionGuideModalProps {
  /** Which permission this modal is about */
  type: PermissionType;
  /** Called when the user taps the secondary button or the backdrop */
  onDismiss: () => void;
  /** Override the secondary button label */
  dismissLabel?: string;
}

export default function MicPermissionGuideModal({
  type,
  onDismiss,
  dismissLabel,
}: PermissionGuideModalProps) {
  const [os, setOs] = useState<OS>("other");

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const config = os === "android" ? copy[type].android : copy[type].ios;
  const accent = accentColor[type];
  const fallbackDismissLabel =
    type === "microphone" ? "Type manually instead" : "Not now";
  const secondaryLabel = dismissLabel ?? fallbackDismissLabel;

  const handlePrimary = () => {
    if (os === "android") {
      // Attempt to open Android app settings via intent URI.
      // Works on Chrome for Android; silently falls through on unsupported browsers.
      try {
        window.location.href =
          "intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=app.vercel.route_nine_dusky;end";
      } catch {
        /* noop — user sees the steps above as fallback */
      }
    } else {
      window.open(PRODUCTION_URL, "_blank");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          background: "var(--color-background-card, #16162a)",
          borderRadius: "24px 24px 0 0",
          padding: "12px 20px 40px",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxHeight: "92dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Drag pill */}
        <div
          style={{
            width: "36px",
            height: "4px",
            background: "var(--color-border-default, rgba(255,255,255,0.14))",
            borderRadius: "2px",
            margin: "0 auto 4px",
            flexShrink: 0,
          }}
        />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: iconBg[type],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {type === "microphone" ? (
              <Mic size={24} color={accent} />
            ) : (
              <MapPin size={24} color={accent} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--color-text-primary, #fff)",
                lineHeight: "1.25",
              }}
            >
              {config.headline}
            </h3>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "13.5px",
                color: "var(--color-text-secondary, rgba(255,255,255,0.58))",
                lineHeight: "1.55",
              }}
            >
              {config.body}
            </p>
          </div>
        </div>

        {/* Numbered steps */}
        <div
          style={{
            background: "var(--color-background-app, rgba(255,255,255,0.04))",
            borderRadius: "16px",
            border: "1px solid var(--color-border-default, rgba(255,255,255,0.08))",
            overflow: "hidden",
          }}
        >
          {config.steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                padding: "14px 16px",
                borderBottom:
                  i < config.steps.length - 1
                    ? "1px solid var(--color-border-default, rgba(255,255,255,0.06))"
                    : "none",
              }}
            >
              {/* Number badge — always visible, high contrast so users can glance back */}
              <span
                aria-hidden="true"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: accent,
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "1px",
                  letterSpacing: "-0.3px",
                }}
              >
                {i + 1}
              </span>
              {/* Step text — supports inline JSX bold */}
              <span
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-primary, rgba(255,255,255,0.9))",
                  lineHeight: "1.5",
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
          <button
            onClick={handlePrimary}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "15px",
              borderRadius: "14px",
              border: "none",
              background: accent,
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.1px",
            }}
          >
            {os === "android" ? (
              <Settings size={17} />
            ) : (
              <ExternalLink size={17} />
            )}
            {config.primaryLabel}
          </button>

          <button
            onClick={onDismiss}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "14px",
              border: "1px solid var(--color-border-default, rgba(255,255,255,0.12))",
              background: "transparent",
              color: "var(--color-text-secondary, rgba(255,255,255,0.58))",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
