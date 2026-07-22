"use client";

import { useState, useEffect } from "react";
import { Share, MoreVertical, PlusSquare, Smartphone, X } from "lucide-react";
import styles from "./pwa-install.module.css";

export default function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if user is already running in standalone PWA mode (Home Screen app)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    // If already installed to home screen, do NOT show banner
    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // Check if user dismissed banner recently
    const dismissed = localStorage.getItem("route-pwa-banner-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 86400000 * 3) {
      // Dismissed within last 3 days
      setShowBanner(false);
      return;
    }

    // Detect OS
    const ua = navigator.userAgent || "";
    const iosDevice = /iPhone|iPad|iPod/.test(ua);
    const androidDevice = /Android/.test(ua);

    setIsIos(iosDevice);
    setIsAndroid(androidDevice || (!iosDevice && !androidDevice));
    setShowBanner(true);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("route-pwa-banner-dismissed", Date.now().toString());
    }
  };

  if (!showBanner) return null;

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerHeader}>
        <div className={styles.bannerTitleGroup}>
          <Smartphone size={20} className={styles.icon} />
          <h4>Add Route to Home Screen</h4>
        </div>
        <button onClick={handleDismiss} className={styles.closeBtn} aria-label="Dismiss banner">
          <X size={18} />
        </button>
      </div>

      <p className={styles.rationaleText}>
        During a ride, every second counts. Adding Route to your Home Screen gives you instant 1-tap emergency access and enables your phone to receive instant trip safety notifications.
      </p>

      <div className={styles.stepsBox}>
        {isIos && (
          <div className={styles.stepRow}>
            <span>1. Tap Safari <strong>Share</strong> button <Share size={14} style={{ display: "inline", verticalAlign: "middle" }} /></span>
            <span>2. Select <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: "inline", verticalAlign: "middle" }} /></span>
          </div>
        )}

        {isAndroid && (
          <div className={styles.stepRow}>
            <span>1. Tap Chrome <strong>Menu</strong> (3 dots) <MoreVertical size={14} style={{ display: "inline", verticalAlign: "middle" }} /></span>
            <span>2. Select <strong>Install app / Add to Home Screen</strong></span>
          </div>
        )}
      </div>

      <button onClick={handleDismiss} className={`${styles.gotItBtn} secondary`}>
        Got it, thanks
      </button>
    </div>
  );
}
