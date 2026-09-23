"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  PhoneCall, 
  Copy, 
  Check, 
  Loader2, 
  Share2
} from "lucide-react";
import styles from "./public-trip.module.css";
import RouteLogo from "@/components/ui/RouteLogo";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicTripPage({ params }: PageProps) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);

  // Fetch Public Trip Summary
  const trip = useQuery(api.trips.getTripPublic, { tripId: id as any });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (trip === undefined) {
    return (
      <main className={styles.container}>
        <div className={styles.loadingBox}>
          <Loader2 className={styles.spin} size={36} color="var(--color-brand-primary)" />
          <p>Loading trip summary...</p>
        </div>
      </main>
    );
  }

  if (trip === null) {
    return (
      <main className={styles.container}>
        <div className={styles.card} style={{ textAlign: "center", padding: "32px 20px" }}>
          <h2>Trip Not Found</h2>
          <p>This trip link may have expired or is invalid.</p>
          <Link href="/welcome" className="primary" style={{ marginTop: "16px", textDecoration: "none" }}>
            Open Route App
          </Link>
        </div>
      </main>
    );
  }

  const isFlagged = trip.flagCount > 0 || trip.dangerousStatus;

  return (
    <main className={styles.container}>
      <header className={styles.navHeader}>
        <div className={styles.logoRow}>
          <RouteLogo size={32} color="#ffffff" lineColor="#000000" />
          <span className={styles.logoTitle}>Route</span>
        </div>
        <button onClick={handleCopyLink} className={styles.shareHeaderBtn}>
          {copied ? <Check size={16} /> : <Share2 size={16} />}
        </button>
      </header>

      {/* TRIP SUMMARY CARD */}
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.commuterTitle}>
            {trip.userName} boarded a vehicle
          </span>
          <span className={styles.timestamp}>
            {new Date(trip.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* VEHICLE PLATE & TYPE */}
        <div className={styles.plateContainer}>
          <div className={styles.plateBadge}>{trip.plate}</div>
          <div className={styles.transportType}>{trip.transportType}</div>
        </div>

        {/* ROUTE DETAILS */}
        <div className={styles.routeBox}>
          <div className={styles.routeItem}>
            <MapPin size={18} color="var(--color-brand-primary)" />
            <div>
              <span className={styles.routeLabel}>Boarded at:</span>
              <strong className={styles.routeVal}>{trip.boardingLocation}</strong>
            </div>
          </div>

          {trip.destination && (
            <div className={styles.routeItem}>
              <Navigation size={18} color="#22c55e" />
              <div>
                <span className={styles.routeLabel}>Destination:</span>
                <strong className={styles.routeVal}>{trip.destination}</strong>
              </div>
            </div>
          )}
        </div>

        {/* VEHICLE DETAILS */}
        {trip.description && (
          <div className={styles.descriptionBox}>
            <span className={styles.routeLabel}>Vehicle details:</span>
            <p className={styles.descText}>{trip.description}</p>
          </div>
        )}

        {/* COMMUNITY SAFETY RECORD */}
        <div className={`${styles.safetyBadgeBox} ${isFlagged ? styles.safetyBoxFlagged : styles.safetyBoxClean}`}>
          {isFlagged ? (
            <>
              <ShieldAlert size={20} color="#ef4444" />
              <div>
                <strong>Community Flagged Vehicle</strong>
                <span>This vehicle has {trip.flagCount} previous report(s) registered on Route.</span>
              </div>
            </>
          ) : (
            <>
              <ShieldCheck size={20} color="#22c55e" />
              <div>
                <strong>Clean Vehicle Safety Record</strong>
                <span>No safety concerns or flags reported for this vehicle.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* EMERGENCY HELPLINES CARD */}
      <div className={styles.card} style={{ marginTop: "16px" }}>
        <h3 className={styles.sectionHeader}>Emergency Helplines (Lagos)</h3>
        <p className={styles.sectionSub}>Quick dial emergency contacts if you need immediate assistance:</p>
        
        <div className={styles.helplineGrid}>
          <a href="tel:767" className={styles.helplineBtn}>
            <PhoneCall size={18} /> LASEMA Emergency (767)
          </a>
          <a href="tel:112" className={styles.helplineBtn}>
            <PhoneCall size={18} /> Police Toll-Free (112)
          </a>
        </div>
      </div>

      <footer className={styles.footerNote}>
        <span>Route • Lagos Commuter Safety Network</span>
      </footer>
    </main>
  );
}
