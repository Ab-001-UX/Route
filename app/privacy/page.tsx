"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Shield } from "lucide-react";
import styles from "./privacy.module.css";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const handleBack = () => {
    // If they have historical navigation, go back. Otherwise, route home.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  return (
    <main className={styles.container}>
      <button onClick={handleBack} className="backBtn" aria-label="Go back">
        <ChevronLeft size={20} />
      </button>

      <div className={styles.card}>
        <header className={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Shield className={styles.icon} size={28} color="var(--color-brand-primary)" />
            <h1>Privacy Policy</h1>
          </div>
          <span className={styles.subtitle}>Last updated: June 15, 2026</span>
        </header>

        <section className={styles.content}>
          <div className={styles.section}>
            <p>
              Welcome to Route. We are committed to protecting your personal safety and data privacy. 
              This Privacy Policy explains how we collect, use, and safeguard your information when you use our passive safety application.
            </p>
          </div>

          <div className={styles.section}>
            <h2>1. Information We Collect</h2>
            <p>To provide safety tracking, we collect the following types of information:</p>
            <ul>
              <li><strong>Phone Number:</strong> Collected via Clerk during onboarding for authentication and emergency communication.</li>
              <li><strong>Emergency Contacts:</strong> Names, labels, and contact numbers of individuals you designate to receive notifications.</li>
              <li><strong>GPS Location Data:</strong> Encrypted coordinates captured at the start of a trip and every 2 minutes while active. Location coordinates are encrypted at rest using AES-256-GCM and only decrypted when shared with your designated contacts.</li>
              <li><strong>Device Info:</strong> Basic browser metadata (e.g. iOS vs Android) to tailor service worker and PWA installations.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>2. How We Use Information</h2>
            <p>We process your data solely for the following purposes:</p>
            <ul>
              <li>Gating access and authenticating your commuter session.</li>
              <li>Transmitting emergency push notifications and SMS updates to your designated active contacts.</li>
              <li>Generating anonymous safety alerts (flags) for Lagos-based vehicles.</li>
              <li>Storing and updating your personal theme, text scale, and local privacy preference logs.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>3. Data Protection and Encryption</h2>
            <p>
              We implement stringent safeguards to protect high-risk safety data:
            </p>
            <ul>
              <li><strong>Encryption at Rest:</strong> GPS location coordinates and Firebase Cloud Messaging (FCM) tokens are encrypted using military-grade AES-256-GCM.</li>
              <li><strong>Anonymity:</strong> Incident flags and post-ride surveys are anonymous. Your commuter user identity is never tied to vehicle flags or incident reports.</li>
              <li><strong>Access Control:</strong> Administrative access is strictly limited to authorized personnel via server-side verification.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>4. Cookies and Consent</h2>
            <p>
              We use essential cookies to manage session states, remember styling configuration (theme, font scale), and enforce local privacy preferences. 
              By utilizing the application, you consent to our use of essential cookies. You may manage non-essential preferences via the cookie banner.
            </p>
          </div>

          <div className={styles.section}>
            <h2>5. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this policy, please contact our administrator Abimbola.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
