"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { User, Check, ArrowRight, Loader2 } from "lucide-react";
import styles from "./onboarding.module.css";
import { safeLocalStorage } from "@/lib/storage";

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createUser = useMutation(api.users.createUser);
  const updateUser = useMutation(api.users.updateUser);

  // If user already exists and has displayName set, skip to home
  useEffect(() => {
    if (currentUser !== undefined && currentUser !== null) {
      router.replace("/home");
    }
  }, [currentUser, router]);

  useEffect(() => {
    safeLocalStorage.setItem("route-last-active", Date.now().toString());
  }, []);

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!isAuthenticated) {
      setErrorMsg("Syncing authentication with server. Please wait a moment.");
      setLoading(false);
      return;
    }

    try {
      if (currentUser) {
        if (displayName.trim()) {
          await updateUser({ displayName: displayName.trim() });
        }
      } else {
        await createUser({
          displayName: displayName.trim() || undefined,
        });
      }
      safeLocalStorage.setItem("route-last-active", Date.now().toString());
      router.replace("/home");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <main className={styles.container}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px", color: "var(--color-text-primary)" }}>
          <Loader2 className={styles.spin} size={36} color="var(--color-brand-primary)" />
          <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>Setting up your profile...</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.onboardingHeader}>
        <div className={styles.stepControlsRow}>
          <div style={{ width: "32px" }} />
          <span className={styles.stepIndicator}>Profile Setup</span>
        </div>
      </header>

      <section className={styles.stepContent}>
        <div className={styles.iconContainer}>
          <User size={48} className={styles.accentIcon} />
        </div>
        <h1>Welcome to Route!</h1>
        <p>What should we call you? Enter your name or display handle to personalize your experience.</p>

        {errorMsg && (
          <div className={styles.errorBanner}>
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg("")} className={styles.dismissErrorBtn}>×</button>
          </div>
        )}

        <form onSubmit={handleFinishOnboarding} className={styles.form}>
          <input
            type="text"
            placeholder="Your name or handle (e.g. Amara)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={styles.input}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="primary" 
            disabled={loading || isAuthLoading}
          >
            {loading ? (
              <Loader2 className={styles.spin} size={18} />
            ) : (
              <>Start Commuting <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
