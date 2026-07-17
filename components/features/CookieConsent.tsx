"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./cookie-consent.module.css";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("route-cookie-consent");
    if (!consent) {
      // Delay appearance slightly for better UX entry
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("route-cookie-consent", "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("route-cookie-consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.banner} ${visible ? styles.visible : ""}`}>
        <div className={styles.content}>
          <h5 className={styles.title}>Cookie & Privacy Consent</h5>
          <p className={styles.text}>
            We use essential cookies to manage authenticated sessions, styling preferences, 
            and local privacy modes. By accepting, you consent to our use of these core cookies. 
            Review our {" "}
            <Link href="/privacy" onClick={() => setVisible(false)}>
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </div>
        <div className={styles.actions}>
          <button onClick={handleReject} className={styles.rejectBtn}>
            Decline Non-Essential
          </button>
          <button onClick={handleAccept} className={styles.acceptBtn}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
