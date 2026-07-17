"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Compass, CheckCircle2, ShieldAlert, Clock } from "lucide-react";
import styles from "./detail.module.css";
import { useSettings } from "@/components/providers/ThemeProvider";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TripDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { privacyMode } = useSettings();

  // Fetch Trip Details
  const trip = useQuery(api.trips.getTrip, { tripId: id as any });
  const endTripMutation = useMutation(api.trips.endTrip);

  // States
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastTracked, setLastTracked] = useState<string>("");
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [endLoading, setEndLoading] = useState(false);

  // Countdown Timer Effect
  useEffect(() => {
    if (!trip || trip.status !== "active") return;

    const calculateTimeLeft = () => {
      const diff = trip.timerExpiry - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [trip?.timerExpiry, trip?.status]);

  // Periodic Background Location Tracking (Every 2 Minutes)
  useEffect(() => {
    if (!trip || trip.status !== "active") return;

    // Track immediately on load
    logLocation();

    const tracker = setInterval(() => {
      logLocation();
    }, 120000); // 120000 ms = 2 minutes

    return () => clearInterval(tracker);
  }, [trip?.status]);

  const logLocation = () => {
    if (!navigator.geolocation) return;

    setTrackingLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/trips/location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tripId: id,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
          if (res.ok) {
            const now = new Date();
            setLastTracked(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }
        } catch (err) {
          console.error("Failed to log background location snapshot:", err);
        } finally {
          setTrackingLoading(false);
        }
      },
      (err) => {
        console.warn("Background GPS capture failed:", err);
        setTrackingLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleEndTrip = async () => {
    setEndLoading(true);
    try {
      await endTripMutation({ tripId: id as any });
      // Force refresh or redirect to home to trigger post-ride survey (Day 5 feature)
      router.push("/home");
    } catch (err) {
      console.error("Failed to complete trip:", err);
    } finally {
      setEndLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const maskPlate = (plate: string) => {
    if (!plate) return "";
    return plate.length > 3 ? `${plate.substring(0, 3)}-***` : "HIDDEN";
  };

  if (trip === undefined) {
    return (
      <main className={styles.container} style={{ justifyContent: "center", alignItems: "center" }}>
        <Loader2 className={styles.spin} size={36} color="var(--color-brand-primary)" />
        <p>Loading trip details...</p>
      </main>
    );
  }

  if (trip === null) {
    return (
      <main className={styles.container} style={{ justifyContent: "center", alignItems: "center" }}>
        <p>Trip not found or you are not authorized to view it.</p>
        <button className="primary" onClick={() => router.push("/home")}>
          Return Home
        </button>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <button className="backBtn" onClick={() => router.push("/home")} aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <h2>Trip Details</h2>
      </header>

      <div className={styles.card}>
        <div className={styles.statusHeader}>
          <span className={styles.plateTitle}>
            {privacyMode ? maskPlate(trip.plate) : trip.plate}
          </span>
          <span
            className={`${styles.statusBadge} ${
              trip.status === "active"
                ? styles.statusActive
                : trip.status === "safe"
                ? styles.statusSafe
                : trip.status === "pending-review"
                ? styles.statusPending
                : styles.statusIncident
            }`}
          >
            {trip.status}
          </span>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Vehicle Type</span>
            <span className={styles.value}>{trip.transportType}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Boarding Point</span>
            <span className={styles.value}>
              {privacyMode ? "HIDDEN (Privacy Mode)" : trip.boardingLocation}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Started At</span>
            <span className={styles.value}>
              {new Date(trip.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {trip.status === "active" && (
        <div className={styles.timerContainer}>
          <Clock size={24} color="var(--color-brand-primary)" style={{ opacity: 0.8 }} />
          <span className={styles.timerVal}>{formatTime(timeLeft)}</span>
          <span className={styles.timerLabel}>Time remaining until safety check-in</span>
        </div>
      )}

      {trip.status === "active" && (
        <div className={styles.trackingStatus}>
          <Compass size={14} className={trackingLoading ? styles.spin : ""} />
          <span>
            {lastTracked ? `Location tracked at ${lastTracked}` : "Activating background GPS snapshots..."}
          </span>
        </div>
      )}

      {trip.status === "active" && (
        <button onClick={handleEndTrip} className="primary" disabled={endLoading}>
          {endLoading ? (
            <>
              <Loader2 className={styles.spin} size={18} /> Completing Trip...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} /> I've Arrived Safely
            </>
          )}
        </button>
      )}

      {trip.status !== "active" && (
        <div className={styles.card} style={{ alignItems: "center", textAlign: "center", gap: "var(--spacing-sm)" }}>
          <CheckCircle2 size={40} className={styles.successIcon} color="var(--color-safety-status-safe)" />
          <h3>Trip Concluded</h3>
          <p>This trip was marked as {trip.status}.</p>
          <button className="secondary" style={{ width: "100%" }} onClick={() => router.push("/home")}>
            Return Home
          </button>
        </div>
      )}
    </main>
  );
}
