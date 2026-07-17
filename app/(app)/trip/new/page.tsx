"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, MapPin, Loader2, Check, AlertCircle, Sparkles, X, Users } from "lucide-react";
import styles from "./new.module.css";
import { trackEvent } from "@/lib/analytics";

export default function NewTripPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Contacts missing validation modal state
  const [showContactsModal, setShowContactsModal] = useState(false);

  // Search parameters from plate scanning/search
  const initialPlate = searchParams.get("plate") || "";
  const initialTransportType = searchParams.get("transportType") || "";
  const initialColor = searchParams.get("color") || "";
  const initialWindows = searchParams.get("windows") || "";
  const initialCondition = searchParams.get("condition") || "";

  // Combine vehicle details for description text
  const getCombinedDescription = () => {
    const parts = [];
    if (initialColor) parts.push(initialColor);
    if (initialWindows) parts.push(`windows ${initialWindows}`);
    if (initialCondition) parts.push(initialCondition);
    if (customDescription.trim()) parts.push(customDescription.trim());
    return parts.join(", ");
  };

  // Form State
  const [plate, setPlate] = useState(initialPlate);
  const [transportType, setTransportType] = useState(initialTransportType || "Big bus (Danfo)");
  const [boardingLocation, setBoardingLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [duration, setDuration] = useState("60"); // default 1 hour in minutes
  const [safetyContactId, setSafetyContactId] = useState<any>("");
  const [alertContactIds, setAlertContactIds] = useState<any[]>([]);

  // Geolocation State
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsState, setGpsState] = useState<"idle" | "fetching" | "success" | "error">("idle");

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch Contacts & Saved Vehicles
  const contacts = useQuery(api.contacts.getContacts) || [];
  const activeContacts = contacts.filter((c) => c.status === "active");
  const savedVehicles = useQuery(api.vehicles.getSavedVehicles);
  const hasFewerThanTwoContacts = contacts.length < 2;

  const normalizedInputPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const matchedSaved = savedVehicles?.find(
    (s) => s.plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === normalizedInputPlate
  );
  
  const showWarningGate = !!(matchedSaved && (
    matchedSaved.safetyIndicator === "orange" || 
    matchedSaved.safetyIndicator === "red" || 
    matchedSaved.dangerousStatus
  ));

  // Attempt GPS auto-fill on mount
  useEffect(() => {
    requestGPS();
  }, []);

  const requestGPS = () => {
    if (!navigator.geolocation) {
      setGpsState("error");
      return;
    }

    setGpsState("fetching");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setGpsState("success");
        // Pre-fill location text with coordinates
        setBoardingLocation(`Lagos (GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setGpsState("error");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAlertContactToggle = (contactId: any) => {
    setAlertContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Show warning modal if user doesn't meet minimum contact requirements
    if (activeContacts.length === 0 || hasFewerThanTwoContacts) {
      setShowContactsModal(true);
      return;
    }

    if (!plate.trim()) {
      setErrorMsg("Plate number is required.");
      return;
    }
    if (!boardingLocation.trim()) {
      setErrorMsg("Boarding location is required.");
      return;
    }
    if (!destination.trim()) {
      setErrorMsg("Destination is required.");
      return;
    }
    if (!safetyContactId) {
      setErrorMsg("Please select one contact for safety check-ins.");
      return;
    }
    if (alertContactIds.length === 0) {
      setErrorMsg("Please select at least one contact to receive immediate alert notifications.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plate: plate.toUpperCase().trim(),
          transportType,
          boardingLocation,
          destination,
          lat: lat !== null ? lat : 6.5244, // Default Lagos latitude fallback
          lng: lng !== null ? lng : 3.3792, // Default Lagos longitude fallback
          durationMinutes: parseInt(duration, 10),
          safetyContactId,
          alertContactIds,
          description: getCombinedDescription() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        trackEvent("Trip Logged", {
          success: true,
          transportType,
          durationMinutes: parseInt(duration, 10),
          alertContactsCount: alertContactIds.length,
          hasDescription: !!getCombinedDescription(),
        });
        // Navigate to active trip details view
        router.push(`/trip/${result.data.tripId}`);
      } else {
        setErrorMsg(result.message || "Failed to log your trip.");
        trackEvent("Trip Logged", {
          success: false,
          error: result.message || "Failed to log trip"
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      trackEvent("Trip Logged", {
        success: false,
        error: err.message || "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <button className="backBtn" onClick={() => router.back()} aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <h2>Log a Trip</h2>
        <div style={{ width: 40 }} /> {/* Spacer to balance grid centering */}
      </header>

      <section className={styles.content}>
        {showWarningGate && matchedSaved && (
          <div className={styles.warningBanner}>
            <AlertCircle className={styles.warningIcon} size={28} />
            <div className={styles.warningInfo}>
              <div className={styles.warningTitle}>⚠️ High-Risk Vehicle Warning</div>
              <div className={styles.warningText}>
                The plate <strong>{matchedSaved.plate}</strong> matches a vehicle bookmarked in your database marked with a <strong>{
                  matchedSaved.dangerousStatus || matchedSaved.safetyIndicator === "red"
                    ? "DANGEROUS"
                    : "BE CAREFUL"
                }</strong> risk level.
                {matchedSaved.primaryOffense && (
                  <span> Primary concern: <strong>{matchedSaved.primaryOffense}</strong>.</span>
                )}
                {" "}Please reconsider boarding this vehicle or verify that your safety responder is ready to check in on you.
              </div>
              <span className={styles.warningBadge}>Caution Advised</span>
            </div>
          </div>
        )}

        {hasFewerThanTwoContacts && (
          <div className={styles.errorBanner} style={{ marginBottom: "var(--spacing-md)" }}>
            Add new contact to log trip. You must configure at least 2 emergency contacts to log a trip.
          </div>
        )}

        {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* VEHICLE IDENTIFICATION */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Plate Number</label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.replace(/[^a-zA-Z0-9 -]/g, "").toUpperCase().slice(0, 15))}
              placeholder="e.g. BDG 123AA"
              disabled={loading}
              required
              className="input"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Transport Type</label>
            <select
              value={transportType}
              onChange={(e) => setTransportType(e.target.value)}
              disabled={loading}
            >
              <option value="Tricycle">Tricycle (Keke)</option>
              <option value="Bike (Okada)">Bike (Okada)</option>
              <option value="Small bus (Korope)">Small bus (Korope)</option>
              <option value="Big bus (Danfo)">Big bus (Danfo)</option>
              <option value="Uber">Uber</option>
              <option value="Bolt">Bolt</option>
              <option value="InDrive">InDrive</option>
              <option value="Personal car">Personal car</option>
            </select>
          </div>

          {/* BOARDING LOCATION (GPS AUTO-FILL) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Boarding Location</label>
            <input
              type="text"
              value={boardingLocation}
              onChange={(e) => setBoardingLocation(e.target.value)}
              placeholder="e.g. Iyana-Ipaja, Oshodi"
              disabled={loading}
              required
            />
            <div className={styles.gpsIndicator}>
              {gpsState === "fetching" && (
                <span className={styles.gpsBadge}>
                  <Loader2 className={styles.spin} size={12} /> Auto-detecting coordinates...
                </span>
              )}
              {gpsState === "success" && (
                <span className={`${styles.gpsBadge} ${styles.gpsBadgeSuccess}`}>
                  <Check size={12} /> Boarding coordinates locked (Lagos)
                </span>
              )}
              {gpsState === "error" && (
                <button
                  type="button"
                  onClick={requestGPS}
                  className={styles.gpsBadge}
                  style={{ cursor: "pointer", border: "none", display: "flex", gap: "4px" }}
                >
                  <AlertCircle size={12} /> GPS denied. Tap to retry or type override.
                </button>
              )}
            </div>
          </div>

          {/* DESTINATION (WHERE THE USER IS GOING) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Destination (Where you are going to)</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Lekki Toll Gate, Ikeja City Mall"
              disabled={loading}
              required
            />
          </div>

          {/* CHECK-IN TIMER */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Check-in Timer Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">1 Hour (Recommended)</option>
              <option value="120">2 Hours</option>
              <option value="180">3 Hours</option>
            </select>
            <span className={styles.helpText}>
              Your safety responder gets checked on arrival after this time expires.
            </span>
          </div>

          {/* UNIQUE IDENTIFIERS (OPTIONAL) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Unique Identifiers (Optional)</label>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="e.g. cracked windshield, missing side mirror, conductor has a red cap, driver wears glasses"
              disabled={loading}
              className="textarea"
              style={{
                width: "100%",
                minHeight: "70px",
                borderRadius: "12px",
                border: "1.5px solid var(--color-border-default)",
                padding: "10px 14px",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
            <span className={styles.helpText}>
              Add distinctive features about the vehicle, driver, or conductor that can help safety responders identify them.
            </span>
          </div>

          {/* SAFETY CHECK CONTACT (SINGLE SELECT) */}
          <div className={styles.formGroup}>
            <label className={styles.sectionTitle}>1. Designated Safety Check Contact</label>
            <span className={styles.helpText} style={{ marginBottom: "var(--spacing-xs)" }}>
              Select the contact who will confirm if you arrived safely.
            </span>
            {activeContacts.length === 0 ? (
              <div className={styles.noContactsWarning}>
                <p>No active contacts found. Please complete contact verification or share invite links first.</p>
              </div>
            ) : (
              <div className={styles.contactsContainer}>
                {activeContacts.map((c) => (
                  <div
                    key={`safety-${c._id}`}
                    onClick={() => !loading && setSafetyContactId(c._id)}
                    className={`${styles.optionCard} ${safetyContactId === c._id ? styles.optionCardSelected : ""}`}
                  >
                    <input
                      type="radio"
                      checked={safetyContactId === c._id}
                      onChange={() => {}}
                      style={{ width: "18px", minHeight: "18px" }}
                      disabled={loading}
                    />
                    <div className={styles.optionCardInfo}>
                      <span className={styles.optionCardName}>{c.name}</span>
                      <span className={styles.optionCardMeta}>{c.relationship} • {c.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ALERT CONTACTS (MULTI SELECT) */}
          <div className={styles.formGroup}>
            <label className={styles.sectionTitle}>2. Immediate Alert Contacts</label>
            <span className={styles.helpText} style={{ marginBottom: "var(--spacing-xs)" }}>
              Select contacts who will get notified immediately when you board.
            </span>
            {activeContacts.length === 0 ? (
              <div className={styles.noContactsWarning}>
                <p>Add and activate contacts to enable safety alerts.</p>
              </div>
            ) : (
              <div className={styles.contactsContainer}>
                {activeContacts.map((c) => (
                  <div
                    key={`alert-${c._id}`}
                    onClick={() => !loading && handleAlertContactToggle(c._id)}
                    className={`${styles.optionCard} ${alertContactIds.includes(c._id) ? styles.optionCardSelected : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={alertContactIds.includes(c._id)}
                      onChange={() => {}}
                      style={{ width: "18px", minHeight: "18px" }}
                      disabled={loading}
                    />
                    <div className={styles.optionCardInfo}>
                      <span className={styles.optionCardName}>{c.name}</span>
                      <span className={styles.optionCardMeta}>{c.relationship} • {c.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className={`primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className={styles.spin} size={18} /> Starting Safety Check...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Board Vehicle & Start Trip
              </>
            )}
          </button>
        </form>
      </section>

      {/* POPUP MODAL FOR MISSING CONTACTS */}
      {showContactsModal && (
        <>
          <div 
            className={styles.modalBackdrop} 
            onClick={() => setShowContactsModal(false)} 
          />
          <div className={styles.modalSheet}>
            <div className={styles.modalHandle} />
            <button 
              type="button" 
              className={styles.modalClose} 
              onClick={() => setShowContactsModal(false)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
            <div className={styles.modalIconContainer}>
              <Users size={32} className={styles.modalWarningIcon} />
            </div>
            <h3 className={styles.modalTitle}>Active Contacts Required</h3>
            <p className={styles.modalText}>
              For your safety, Route requires you to configure and verify **at least 2 emergency contacts** before you can start a trip. This ensures your safety responders can be notified if you don't check in on time.
            </p>
            <div className={styles.modalActions}>
              <button 
                type="button" 
                className="primary" 
                onClick={() => router.push("/settings?open=contacts")}
              >
                Manage Trusted Contacts
              </button>
              <button 
                type="button" 
                className="secondary" 
                onClick={() => setShowContactsModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
