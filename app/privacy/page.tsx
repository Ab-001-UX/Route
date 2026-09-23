"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Shield } from "lucide-react";
import styles from "./privacy.module.css";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.backRow}>
          <button 
            onClick={handleBack} 
            className="backBtn" 
            aria-label="Go back"
            title="Back"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className={styles.card}>
          <header className={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Shield className={styles.icon} size={28} color="var(--color-brand-primary)" />
              <h1>Privacy Policy</h1>
            </div>
            <span className={styles.subtitle}>Last updated: September 23, 2026</span>
          </header>

          <section className={styles.content}>
            <div className={styles.section}>
              <p>
                Welcome to Route. We are committed to protecting commuter safety and data privacy across Lagos. 
                This Privacy Policy explains how we handle your information when you search vehicle plates, log trip summaries, and share WhatsApp safety links.
              </p>
            </div>

            <div className={styles.section}>
              <h2>1. Information We Collect</h2>
              <p>Route is designed to operate with minimal data collection:</p>
              <ul>
                <li><strong>Account Credentials:</strong> Email or authentication handles managed securely via Clerk.</li>
                <li><strong>Trip Summary Information:</strong> Vehicle plate numbers, transport types, boarding locations, destinations, and vehicle descriptions entered when logging a trip.</li>
                <li><strong>Community Reports:</strong> Anonymous vehicle incident reports and flag counts submitted by commuters to warn fellow travelers.</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h2>2. How We Use Information</h2>
              <p>Your data is processed solely for:</p>
              <ul>
                <li>Authenticating your user session.</li>
                <li>Generating public trip summary links (`/trip/[id]`) for you to share directly with your loved ones on WhatsApp.</li>
                <li>Maintaining community safety indicators and flag counts for Lagos commercial transport vehicles.</li>
                <li>Storing your app preferences (theme, font scaling, local privacy mode).</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h2>3. Data Protection and Anonymity</h2>
              <p>
                We implement strict privacy protections:
              </p>
              <ul>
                <li><strong>No Contact Storage:</strong> Route does not store your family or friends' contact lists on our servers. You choose who to share your trip link with on WhatsApp.</li>
                <li><strong>No Background Location Tracking:</strong> Route does not require background location tracking or mandatory GPS permissions.</li>
                <li><strong>Anonymous Reporting:</strong> Vehicle safety reports are strictly anonymous. Your user identity is never tied to vehicle flags or incident logs.</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h2>4. Contact Us</h2>
              <p>
                If you have any questions or feedback regarding this policy, please reach out to our team.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
