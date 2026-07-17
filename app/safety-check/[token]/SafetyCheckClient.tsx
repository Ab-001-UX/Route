"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Car, 
  AlertOctagon, 
  Clock, 
  ExternalLink, 
  Loader2, 
  Shield 
} from "lucide-react";
import styles from "./safety-check.module.css";

const getPlateBorderColor = (flagCount?: number) => {
  const count = flagCount ?? 0;
  if (count === 0) return "var(--color-safety-status-safe)";
  if (count === 1 || count === 2) return "var(--color-safety-status-caution)";
  if (count === 3) return "var(--color-safety-status-warning)";
  return "var(--color-safety-status-dangerous)";
};

interface SafetyCheckClientProps {
  token: string;
  isIOS: boolean;
}

export default function SafetyCheckClient({ token, isIOS }: SafetyCheckClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  
  // Triage state
  const [step, setStep] = useState<'triage_safe' | 'triage_traffic' | 'success_safe' | 'success_traffic' | 'emergency_dashboard'>('triage_safe');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Honeypot field for bot protection
  const [honeypot, setHoneypot] = useState("");

  const isTimerExpired = trip?.timerExpiry ? Date.now() >= trip.timerExpiry : false;

  // Fetch trip state on mount
  useEffect(() => {
    async function fetchTripState() {
      if (token === "dev-preview") {
        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const isMockActive = params?.get("status") === "active";
        const urlStep = params?.get("step");

        setTrip({
          userName: "Abimbola",
          plate: "LAG-123-XA",
          boardingLocation: "Lekki Toll Gate",
          destination: "Ikeja City Mall",
          description: "Yellow Danfo, missing right-side mirror, conductor wearing a red cap, driver wearing dark sunglasses.",
          transportType: "Yellow Bus (Danfo)",
          status: urlStep === "emergency" ? "incident-triggered" : "active",
          safetyCheckTokenUsed: false,
          trafficRecheckCount: 0,
          flagCount: 1,
          snapshots: urlStep === "emergency" ? [
            { lat: 6.4312, lng: 3.4244, timestamp: Date.now() - 10 * 60 * 1000 }
          ] : [],
          boardingGPS: { lat: 6.4278, lng: 3.4222 },
          timerExpiry: isMockActive ? Date.now() + 15 * 60 * 1000 : Date.now() - 5000
        });

        if (urlStep === "traffic") {
          setStep("triage_traffic");
        } else if (urlStep === "emergency") {
          setStep("emergency_dashboard");
        } else if (urlStep === "success_safe") {
          setStep("success_safe");
        } else if (urlStep === "success_traffic") {
          setStep("success_traffic");
        } else {
          setStep("triage_safe");
        }

        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/safety-check?token=${token}`);
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        
        const payload = await res.json();
        if (payload.success && payload.data) {
          const data = payload.data;
          setTrip(data);
          
          if (data.status === "incident-triggered") {
            setStep('emergency_dashboard');
          } else if (data.safetyCheckTokenUsed && (data.status === "safe" || data.status === "resolved")) {
            setStep('success_safe');
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to load trip state:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchTripState();
  }, [token]);

  // Primary Check: YES / NO
  const handlePrimaryResponse = async (arrivedSafely: boolean) => {
    if (arrivedSafely) {
      // Direct YES
      await submitResponse("yes");
    } else {
      // NO: Check traffic recheck count
      if (trip && trip.trafficRecheckCount > 0) {
        // Recheck: Bypasses stuck-in-traffic triage and escalates to Emergency directly
        await submitResponse("no");
      } else {
        // First check: triage stuck in traffic
        setStep('triage_traffic');
      }
    }
  };

  // Submit response to Next.js API route
  const submitResponse = async (responseType: "yes" | "no" | "stuck-in-traffic" | "maybe") => {
    setSubmitting(true);
    setErrorMessage("");

    // Dev-preview mode: mock the response locally without hitting the real API
    if (token === "dev-preview") {
      await new Promise((r) => setTimeout(r, 600)); // simulate network delay
      if (responseType === "yes") {
        setStep("success_safe");
      } else if (responseType === "stuck-in-traffic" || responseType === "maybe") {
        setStep("success_traffic");
      } else if (responseType === "no") {
        setTrip((prev: any) => ({ ...prev, status: "incident-triggered" }));
        setStep("emergency_dashboard");
      }
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/safety-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          response: responseType,
          honeypot,
        }),
      });

      const payload = await res.json();

      if (res.ok && payload.success) {
        const updatedTrip = {
          ...trip,
          status: payload.data.option === "no" ? "incident-triggered" : trip?.status,
          snapshots: payload.data.snapshots || trip?.snapshots || [],
          boardingGPS: payload.data.boardingGPS || trip?.boardingGPS,
          trafficRecheckCount: payload.data.recheckCount ?? (trip?.trafficRecheckCount || 0),
        };
        setTrip(updatedTrip);

        if (payload.data.option === "yes") {
          setStep("success_safe");
        } else if (payload.data.option === "traffic") {
          setStep("success_traffic");
        } else if (payload.data.option === "no") {
          setStep("emergency_dashboard");
        }
      } else {
        setErrorMessage(payload.message || "Failed to submit response. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "A connection error occurred. Please check your network.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.loadingCard}>
          <Loader2 className={styles.spinner} size={48} />
          <h1 className={styles.pulseText}>Connecting Securely</h1>
          <p>Verifying commuter's security link...</p>
        </div>
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className={styles.container}>
        <div className={styles.errorCard}>
          <AlertOctagon className={styles.errorIcon} size={56} />
          <h1>Link Not Available</h1>
          <p>This safety check-in link is invalid or has expired (48 hours).</p>
          <div className={styles.divider} />
          <p className={styles.supportNote}>Please call the commuter directly if you are concerned for their safety.</p>
        </div>
      </main>
    );
  }

  const formatBoardingCityCode = (loc?: string) => {
    if (!loc) return "LOS";
    const clean = loc.replace(/[^a-zA-Z\s]/g, "").trim();
    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0] + (words[2]?.[0] || words[1][1] || "X")).toUpperCase();
    }
    return clean.substring(0, 3).toUpperCase();
  };

  const formatCommuterInitials = (name?: string) => {
    if (!name) return "USR";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
    }
    return name.substring(0, 3).toUpperCase();
  };

  // Honeypot Field Component
  const HoneypotField = () => (
    <input
      type="text"
      name="website_url"
      style={{ display: "none" }}
      value={honeypot}
      onChange={(e) => setHoneypot(e.target.value)}
      tabIndex={-1}
      autoComplete="off"
    />
  );

  return (
    <main className={styles.container}>
      {/* Honeypot for bot protection */}
      <HoneypotField />

      {/* STEP 1: Primary Triage Screen */}
      {step === 'triage_safe' && (
        <div className={styles.cardWrapper}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>
              {isTimerExpired ? "Arrived Safely?" : "Trip in Progress"}
            </h1>
            <p className={styles.pageSubtitle}>
              {isTimerExpired ? (
                <>Checking if <strong style={{ color: "#ffffff" }}>{trip.userName}</strong> reached their destination.</>
              ) : (
                <>Details of <strong style={{ color: "#ffffff" }}>{trip.userName}</strong>'s current transit.</>
              )}
            </p>
          </header>

          <section className={styles.safetyCard}>
            {/* Card Header */}
            <div className={styles.cardHeaderRow}>
              <div className={styles.cardBrand}>
                <Shield className={styles.cardBrandIcon} size={16} />
                <span>ROUTE SECURE TRANSIT</span>
              </div>
              <span className={styles.cardCategoryLabel}>SAFETY CHECK</span>
            </div>

            {/* Transit Route Details */}
            <div className={styles.routeContainer}>
              <div className={styles.routeRow}>
                <div className={styles.routeIconIndicator}>
                  <MapPin size={16} style={{ color: "var(--color-brand-primary)" }} />
                </div>
                <div className={styles.routeTextCol}>
                  <span className={styles.routeLabel}>BOARDED AT</span>
                  <span className={styles.routeVal}>{trip.boardingLocation}</span>
                </div>
              </div>

              <div className={styles.routeLineSeparator} />

              <div className={styles.routeRow}>
                <div className={styles.routeIconIndicator}>
                  <MapPin size={16} style={{ color: "var(--color-safety-status-dangerous)" }} />
                </div>
                <div className={styles.routeTextCol}>
                  <span className={styles.routeLabel}>GOING TO</span>
                  <span className={styles.routeVal}>{trip.destination || "Unknown Destination"}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Remarks / Unique Identifiers */}
            {trip.description && (
              <div className={styles.remarksContainer}>
                <span className={styles.remarksLabel}>VEHICLE REMARKS</span>
                <p className={styles.remarksValue}>{trip.description}</p>
              </div>
            )}

            {/* Card Divider Line */}
            <div className={styles.cardDividerLine} />

            {/* Card Footer Section */}
            <div className={styles.cardFooterGrid}>
              <div className={styles.footerItem}>
                <span className={styles.footerLabel}>PLATE NUMBER</span>
                <span className={styles.footerValue}>{trip.plate}</span>
              </div>
              <div className={styles.footerItem}>
                <span className={styles.footerLabel}>VEHICLE TYPE</span>
                <span className={styles.footerValue}>{trip.transportType}</span>
              </div>
              <div className={styles.footerItem} style={{ alignItems: "flex-end" }}>
                <span className={styles.footerLabel}>STATUS</span>
                <span className={styles.footerValueStatus}>ACTIVE</span>
              </div>
            </div>
          </section>

          {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

          {/* Conditional CTA Buttons or Active Info Banner */}
          {isTimerExpired ? (
            <>
              {/* Safety Disclaimer Warning Box */}
              <div className={styles.disclaimerBox}>
                <AlertOctagon size={16} className={styles.disclaimerIcon} />
                <p className={styles.disclaimerText}>
                  <strong>Important:</strong> Your response directly affects the safety tracking for <strong>{trip.userName}</strong>. Please call or text them to confirm their safety before responding. Do not select an option just to clear this notification.
                </p>
              </div>

              <div className={styles.ticketActionsRow}>
                <button 
                  onClick={() => handlePrimaryResponse(true)} 
                  className={styles.yesRectangleBtn}
                  disabled={submitting}
                >
                  <CheckCircle2 size={16} />
                  <span>YES</span>
                </button>
                
                <button 
                  onClick={() => handlePrimaryResponse(false)} 
                  className={styles.noRectangleBtn}
                  disabled={submitting}
                >
                  <AlertTriangle size={16} />
                  <span>NO</span>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.pendingTimerBanner}>
              <Clock size={16} className={styles.pendingTimerIcon} />
              <span>
                Trip is currently in progress. A safety check-in push notification will be sent to you shortly.
              </span>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Stuck in Traffic Triage */}
      {step === 'triage_traffic' && (
        <section className={styles.card}>
          <header className={styles.header}>
            <div className={styles.cautionBadge}>
              <Clock className={styles.clockIcon} size={28} />
            </div>
            <h1 className={styles.question}>Stuck in Traffic?</h1>
            <p className={styles.subtext}>
              If <span className={styles.highlight}>{trip.userName}</span> is just delayed or in traffic, we will snooze this check-in for 15 minutes.
            </p>
          </header>

          {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

          <div className={styles.trafficActions}>
            <button 
              onClick={() => submitResponse("stuck-in-traffic")} 
              className={styles.trafficButton}
              disabled={submitting}
            >
              Yes, stuck in traffic
            </button>
            
            <button 
              onClick={() => submitResponse("maybe")} 
              className={styles.maybeButton}
              disabled={submitting}
            >
              Maybe (Delayed)
            </button>

            <div className={styles.actionDivider}>
              <span>OR</span>
            </div>

            <button 
              onClick={() => submitResponse("no")} 
              className={styles.emergencyNoButton}
              disabled={submitting}
            >
              <ShieldAlert size={20} />
              NO
            </button>
          </div>
        </section>
      )}

      {/* SUCCESS: Safe */}
      {step === 'success_safe' && (
        <section className={styles.card}>
          <div className={styles.successWrapper}>
            <CheckCircle2 className={styles.successLogo} size={72} />
            <h1>Trip Marked Safe</h1>
            <p>Thank you. We have recorded that {trip.userName} arrived safely at their destination.</p>
            <p className={styles.subtext}>This link is now closed.</p>
          </div>
        </section>
      )}

      {/* SUCCESS: Traffic Rescheduled */}
      {step === 'success_traffic' && (
        <section className={styles.card}>
          <div className={styles.trafficWrapper}>
            <Clock className={styles.trafficLogo} size={72} />
            <h1>Snoozed for 15 Mins</h1>
            <p>We've snoozed the alert. A fresh safety check will be sent to you in 15 minutes if they haven't checked in safe by then.</p>
            <p className={styles.subtext}>Please call or text {trip.userName} directly if you'd like to get an immediate update.</p>
          </div>
        </section>
      )}

      {/* EMERGENCY PROTOCOL DASHBOARD */}
      {step === 'emergency_dashboard' && (
        <section className={`${styles.card} ${styles.emergencyCard}`}>
          <div className={styles.emergencySiren}>
            <div className={styles.sirenBeacons}>
              <span className={styles.beaconRed}></span>
              <span className={styles.beaconAlert}></span>
            </div>
            <h1>🚨 EMERGENCY DASHBOARD</h1>
            <p>Commuter safety concern has been flagged. Use the details below to escalate or coordinate emergency response.</p>
          </div>

          <div className={styles.emergencyDialers}>
            <a href="tel:767" className={styles.dialerLasema}>
              <Phone size={20} />
              Call LASEMA (767)
            </a>
            
            <a href="tel:112" className={styles.dialerPolice}>
              <Phone size={20} />
              Call Police (112)
            </a>
          </div>

          {/* Vehicle and Commuter details */}
          <div className={styles.emergencyDetails}>
            <div className={styles.emergencyPlateCard} style={{ borderColor: getPlateBorderColor(trip.flagCount) }}>
              <span className={styles.plateLabel}>NIGERIA VEHICLE LICENSE PLATE</span>
              <span className={styles.plateNumber}>{trip.plate}</span>
            </div>

            <div className={styles.emergencyGrid}>
              <div className={styles.gridItem}>
                <span className={styles.gridLabel}>Commuter</span>
                <span className={styles.gridValue}>{trip.userName}</span>
              </div>
              <div className={styles.gridItem}>
                <span className={styles.gridLabel}>Transit Type</span>
                <span className={styles.gridValue}>{trip.transportType}</span>
              </div>
              <div className={styles.gridItem}>
                <span className={styles.gridLabel}>Boarding Location</span>
                <span className={styles.gridValue}>{trip.boardingLocation}</span>
              </div>
              <div className={styles.gridItem}>
                <span className={styles.gridLabel}>Status</span>
                <span className={`${styles.gridValue} ${styles.dangerValue}`}>INCIDENT TRIGGERED</span>
              </div>
            </div>
          </div>

          {/* Decrypted GPS Snapshot Breadcrumbs */}
          <div className={styles.emergencyGPS}>
            <h3>🛰️ DECRYPTED LOCATION SNAPSHOTS</h3>
            <p className={styles.gpsIntro}>
              Below are the decrypted coordinates of where {trip.userName} boarded and their last known location snapshots.
            </p>

            <div className={styles.gpsList}>
              {trip.boardingGPS && (
                <div className={styles.gpsRow}>
                  <div className={styles.gpsInfo}>
                    <span className={styles.gpsLabel}>Boarding Location (GPS)</span>
                    <span className={styles.gpsCoords}>{trip.boardingGPS.lat.toFixed(6)}, {trip.boardingGPS.lng.toFixed(6)}</span>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${trip.boardingGPS.lat},${trip.boardingGPS.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mapLink}
                  >
                    Map <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {trip.snapshots && trip.snapshots.length > 0 ? (
                trip.snapshots.map((snap: any, idx: number) => (
                  <div className={styles.gpsRow} key={idx}>
                    <div className={styles.gpsInfo}>
                      <span className={styles.gpsLabel}>
                        Snapshot {trip.snapshots.length - idx} • {new Date(snap.capturedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                      </span>
                      <span className={styles.gpsCoords}>{snap.lat.toFixed(6)}, {snap.lng.toFixed(6)}</span>
                    </div>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${snap.lat},${snap.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      Map <ExternalLink size={14} />
                    </a>
                  </div>
                ))
              ) : (
                <div className={styles.noSnapshots}>
                  <p>No GPS tracking snapshots registered during the ride.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
