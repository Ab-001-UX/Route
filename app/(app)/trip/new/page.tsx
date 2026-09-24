"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, MessageCircle, Copy, Check, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import styles from "./new.module.css";
import { trackEvent } from "@/lib/analytics";

export default function NewTripPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search parameters from plate lookup
  const initialPlate = searchParams.get("plate") || "";
  const initialTransportType = searchParams.get("transportType") || "";
  const initialColor = searchParams.get("color") || "";
  const initialWindows = searchParams.get("windows") || "";
  const initialCondition = searchParams.get("condition") || "";

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

  // Submission & Modal State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdTrip, setCreatedTrip] = useState<{
    tripId: string;
    plate: string;
    transportType: string;
    boardingLocation: string;
    destination?: string;
    shareUrl: string;
    shareMessage: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Convex mutations
  const createTrip = useMutation(api.trips.createTrip);
  const savedVehicles = useQuery(api.vehicles.getSavedVehicles);

  const normalizedInputPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const matchedSaved = savedVehicles?.find(
    (s) => s.plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === normalizedInputPlate
  );
  
  const showWarningGate = !!(matchedSaved && (
    matchedSaved.safetyIndicator === "orange" || 
    matchedSaved.safetyIndicator === "red" || 
    matchedSaved.dangerousStatus
  ));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!plate.trim()) {
      setErrorMsg("Plate number is required.");
      return;
    }
    if (!boardingLocation.trim()) {
      setErrorMsg("Boarding location is required.");
      return;
    }

    setLoading(true);

    try {
      const result = await createTrip({
        plate: plate.toUpperCase().trim(),
        transportType,
        boardingLocation: boardingLocation.trim(),
        destination: destination.trim() || undefined,
        description: getCombinedDescription() || undefined,
      });

      const origin = typeof window !== "undefined" ? window.location.origin : "https://route.app";
      const shareUrl = `${origin}/trip/${result.tripId}`;
      const destText = result.destination ? ` to ${result.destination}` : "";
      const message = `🚍 I'm boarding a ${result.transportType} (${result.plate}) from ${result.boardingLocation}${destText}. Track my vehicle & trip summary here:\n${shareUrl}`;

      setCreatedTrip({
        tripId: result.tripId,
        plate: result.plate,
        transportType: result.transportType,
        boardingLocation: result.boardingLocation,
        destination: result.destination,
        shareUrl,
        shareMessage: message,
      });

      trackEvent("Trip Logged", {
        success: true,
        transportType,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log trip summary.");
      trackEvent("Trip Logged", {
        success: false,
        error: err.message || "Failed to log trip",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!createdTrip) return;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(createdTrip.shareMessage)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyLink = async () => {
    if (!createdTrip) return;
    try {
      await navigator.clipboard.writeText(createdTrip.shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <button className="backBtn" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h2>Log Trip</h2>
        <div style={{ width: 44 }} />
      </header>

      <section className={styles.content}>
        {showWarningGate && matchedSaved && (
          <div className={styles.warningBanner}>
            <AlertCircle className={styles.warningIcon} size={28} />
            <div className={styles.warningInfo}>
              <div className={styles.warningTitle}>⚠️ Flagged Vehicle Warning</div>
              <div className={styles.warningText}>
                The plate <strong>{matchedSaved.plate}</strong> has previous safety reports registered. Please exercise caution when boarding.
              </div>
            </div>
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
              <option value="Big bus (Danfo)">Big bus (Danfo)</option>
              <option value="Small bus (Korope)">Small bus (Korope)</option>
              <option value="Tricycle (Keke)">Tricycle (Keke)</option>
              <option value="Bike (Okada)">Bike (Okada)</option>
              <option value="Uber / Taxi">Uber / Taxi</option>
              <option value="Personal car">Personal car</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* BOARDING LOCATION */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Boarding Location</label>
            <input
              type="text"
              value={boardingLocation}
              onChange={(e) => setBoardingLocation(e.target.value)}
              placeholder="e.g. Obalende, Yaba Underbridge"
              disabled={loading}
              required
            />
          </div>

          {/* DESTINATION */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Destination (Where you are going)</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Lekki Phase 1, Ajah Market"
              disabled={loading}
            />
          </div>

          {/* VEHICLE DETAILS (OPTIONAL) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Vehicle Details (Optional)</label>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="e.g. Yellow Danfo with blue stripes, driver wears glasses"
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
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className={`primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className={styles.spin} size={18} /> Logging Trip...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Log Trip & Generate WhatsApp Link
              </>
            )}
          </button>
        </form>
      </section>

      {/* WHATSAPP SHARE MODAL */}
      {createdTrip && (
        <>
          <div className={styles.modalBackdrop} onClick={() => setCreatedTrip(null)} />
          <div className={styles.modalSheet}>
            <div className={styles.modalHandle} />
            <div className={styles.modalIconContainer} style={{ background: "rgba(37, 211, 102, 0.12)" }}>
              <MessageCircle size={32} color="#25D366" />
            </div>
            <h3 className={styles.modalTitle}>Trip Logged Successfully!</h3>
            <p className={styles.modalText}>
              Your trip summary link is ready. Send it to your loved ones on WhatsApp so they have your vehicle details.
            </p>

            <div className={styles.sharePreviewBox}>
              <p>{createdTrip.shareMessage}</p>
            </div>

            <div className={styles.modalActions} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="primary"
                onClick={handleShareWhatsApp}
                style={{ background: "#25D366", color: "#ffffff", borderColor: "#25D366" }}
              >
                <MessageCircle size={18} /> Share on WhatsApp
              </button>
              <button
                type="button"
                className="secondary"
                onClick={handleCopyLink}
              >
                {copied ? <><Check size={16} /> Link Copied!</> : <><Copy size={16} /> Copy Message</>}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => router.push(`/trip/${createdTrip.tripId}`)}
              >
                View Trip Page
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
