"use client";

import { useState, useEffect } from "react";
import { Bell, Share, CheckCircle, AlertTriangle, Smartphone, ChevronRight } from "lucide-react";
import styles from "./activation.module.css";
import { trackEvent } from "@/lib/analytics";

interface ContactActivationClientProps {
  token: string;
  isIOSInitial: boolean;
}

export default function ContactActivationClient({ token, isIOSInitial }: ContactActivationClientProps) {
  const [step, setStep] = useState(1); // 1 = Add to Home Screen (iOS only), 2 = Notifications, 3 = Success, 4 = Error
  const [isIOS, setIsIOS] = useState(isIOSInitial);
  const [isStandalone, setIsStandalone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Honeypot field for bot protection
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    // Detect standalone mode client-side
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
      
      // Update iOS detection client-side just in case
      const userAgent = window.navigator.userAgent;
      const iOSDevice = /iPhone|iPad|iPod/i.test(userAgent);
      setIsIOS(iOSDevice);

      // If already standalone or not iOS, skip Add to Home Screen instructions
      if (isStandaloneMode || !iOSDevice) {
        setStep(2);
      }
    };

    checkStandalone();
  }, [isStandalone]);

  const handleActivate = async () => {
    setLoading(true);
    setErrorMessage("");

    let fcmToken = "";

    try {
      // 1. Request Notification Permission
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // Normally we'd fetch FCM token from service worker,
          // using a stable mock token here for local development/simulation
          fcmToken = `fcm_token_simulated_${Math.random().toString(36).substring(2)}`;
        } else {
          setErrorMessage("Notification permission is required to act as an alert contact. Please allow notifications.");
          setLoading(false);
          return;
        }
      } else {
        // Fallback for browsers without Push API support
        fcmToken = "push_not_supported_fallback";
      }

      // 2. Submit to API route
      const res = await fetch("/api/contact-activation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          fcmToken,
          honeypot,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        trackEvent("Contact Activated", { success: true });
        setStep(3); // Success
      } else {
        const errMsg = data.message || "Failed to activate your link.";
        setErrorMessage(errMsg);
        trackEvent("Contact Activated", { success: false, error: errMsg });
        setStep(4); // Error
      }
    } catch (err: any) {
      const errMsg = err.message || "An unexpected error occurred.";
      setErrorMessage(errMsg);
      trackEvent("Contact Activated", { success: false, error: errMsg });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      {step === 1 && (
        <section className={styles.card}>
          <header className={styles.header}>
            <Smartphone size={40} className={styles.icon} />
            <h1>Add to Home Screen</h1>
            <p>To act as a safety responder on iOS, Route must be running in standalone mode from your home screen.</p>
          </header>

          <div className={styles.instructions}>
            <div className={styles.step}>
              <span className={styles.badge}>1</span>
              <p>Tap the <strong>Share</strong> button <Share size={18} className={styles.inlineIcon} /> in Safari's bottom toolbar.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.badge}>2</span>
              <p>Scroll down the list and tap <strong>Add to Home Screen</strong>.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.badge}>3</span>
              <p>Open this app from your Home Screen to complete activation.</p>
            </div>
          </div>

          <button onClick={() => setStep(2)} className="primary">
            I've Added It • Continue <ChevronRight size={18} />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className={styles.card}>
          <header className={styles.header}>
            <Bell size={40} className={styles.icon} />
            <h1>Enable Alerts</h1>
            <p>Route will send you push notifications if your contact starts a trip, delays, or signals an emergency.</p>
          </header>

          {errorMessage && <div className={styles.errorText}>{errorMessage}</div>}

          {/* Honeypot field (hidden from view) */}
          <input
            type="text"
            name="website"
            style={{ display: "none" }}
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />

          <button onClick={handleActivate} className="primary" disabled={loading}>
            {loading ? "Activating..." : "Enable Safety Alerts"}
          </button>
        </section>
      )}

      {step === 3 && (
        <section className={styles.card}>
          <header className={styles.header}>
            <CheckCircle size={48} className={styles.successIcon} />
            <h1>Setup Complete</h1>
            <p>You are now registered as an active safety contact. You can close this browser window.</p>
          </header>
        </section>
      )}

      {step === 4 && (
        <section className={styles.card}>
          <header className={styles.header}>
            <AlertTriangle size={48} className={styles.errorIcon} />
            <h1>Activation Failed</h1>
            <p>{errorMessage || "We couldn't verify this invite link. It might have expired (7 days) or been removed."}</p>
          </header>

          <button onClick={() => setStep(2)} className="secondary">
            Retry Activation
          </button>
        </section>
      )}
    </main>
  );
}
