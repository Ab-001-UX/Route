"use client";

import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Smile, 
  AlertTriangle, 
  ShieldCheck, 
  X, 
  ChevronRight, 
  Loader2,
  AlertOctagon
} from "lucide-react";
import styles from "./post-ride-survey.module.css";
import { trackEvent } from "@/lib/analytics";

const INCIDENT_CATEGORIES = [
  { value: "", label: "Choose an option..." },
  { value: "harassment", label: "Harassment / Threat" },
  { value: "reckless-driving", label: "Reckless / Dangerous driving" },
  { value: "theft-robbery", label: "Attempted theft / Robbery" },
  { value: "route-deviation", label: "Unexpected route deviation" },
  { value: "vehicle-breakdown", label: "Vehicle breakdown / Issue" },
  { value: "other", label: "Other (please specify)" },
];

export default function PostRideSurvey() {
  const lastTrip = useQuery(api.trips.getLastUnansweredTrip);
  const submitSurvey = useAction(api.rateLimitedActions.rateLimitedSubmitPostRideSurvey);

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'feedback' | 'success'>('initial');
  const [selectedCategory, setSelectedCategory] = useState("");
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check if session storage snoozes this survey
  useEffect(() => {
    if (lastTrip) {
      const isSnoozed = sessionStorage.getItem(`snoozed_survey_trip_${lastTrip._id}`) === "true";
      if (!isSnoozed) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  }, [lastTrip]);

  if (!lastTrip || !isOpen) return null;

  const handleSnooze = () => {
    sessionStorage.setItem(`snoozed_survey_trip_${lastTrip._id}`, "true");
    setIsOpen(false);
  };

  const handleSmoothResponse = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitSurvey({
        tripId: lastTrip._id,
        response: "smooth",
      });
      trackEvent("Survey Submitted", { response: "smooth", success: true });
      setStep('success');
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit survey.");
      trackEvent("Survey Submitted", { response: "smooth", success: false, error: err.message || "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeltOffSubmit = async () => {
    let categoryToSubmit = selectedCategory;
    if (selectedCategory === "other") {
      if (!otherText.trim()) {
        setError("Please specify your concern in the text field.");
        return;
      }
      categoryToSubmit = otherText.trim();
    }

    if (!categoryToSubmit) {
      setError("Please select a category that matches your experience.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitSurvey({
        tripId: lastTrip._id,
        response: "felt-off",
        incidentType: categoryToSubmit,
      });
      trackEvent("Survey Submitted", { response: "felt-off", category: selectedCategory, success: true });
      setStep('success');
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit survey.");
      trackEvent("Survey Submitted", { response: "felt-off", category: selectedCategory, success: false, error: err.message || "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={handleSnooze} />
      
      <div className={styles.modal}>
        {step !== 'success' && (
          <button className={styles.closeBtn} onClick={handleSnooze} disabled={submitting}>
            <X size={20} />
          </button>
        )}

        {/* STEP 1: Initial Prompt */}
        {step === 'initial' && (
          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.shieldIconWrapper}>
                <ShieldCheck className={styles.shieldIcon} size={28} />
              </div>
              <h2>How was your transit ride?</h2>
              <p>
                Your feedback on vehicle <span className={styles.plate}>{lastTrip.plate}</span> helps keep the Lagos commuter database safe and anonymous.
              </p>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.options}>
              <button 
                onClick={handleSmoothResponse} 
                className={styles.smoothBtn}
                disabled={submitting}
              >
                <Smile size={24} />
                <span>It was smooth & safe</span>
                {submitting && <Loader2 className={styles.spinner} size={16} />}
              </button>

              <button 
                onClick={() => setStep('feedback')} 
                className={styles.feltOffBtn}
                disabled={submitting}
              >
                <AlertTriangle size={24} />
                <span>Something felt off</span>
              </button>
            </div>

            <button onClick={handleSnooze} className={styles.snoozeBtn} disabled={submitting}>
              Remind me later
            </button>
          </div>
        )}

        {/* STEP 2: Category Selector */}
        {step === 'feedback' && (
          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.warningIconWrapper}>
                <AlertOctagon className={styles.warningIcon} size={28} />
              </div>
              <h2>What felt off?</h2>
              <p>Your concern is logged completely anonymously to raise safety awareness for this vehicle plate.</p>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.dropdownContainer}>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setError("");
                }}
                className={styles.dropdown}
                disabled={submitting}
              >
                {INCIDENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {selectedCategory === "other" && (
                <input
                  type="text"
                  placeholder="Specify safety concern (e.g. extortion, speed, etc)..."
                  value={otherText}
                  onChange={(e) => {
                    setOtherText(e.target.value);
                    setError("");
                  }}
                  className={styles.otherInput}
                  maxLength={100}
                  disabled={submitting}
                  autoFocus
                />
              )}
            </div>

            <div className={styles.actions}>
              <button 
                onClick={() => setStep('initial')} 
                className={styles.backBtn}
                disabled={submitting}
              >
                Back
              </button>
              <button 
                onClick={handleFeltOffSubmit} 
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Anonymous Report"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'success' && (
          <div className={styles.successWrapper}>
            <ShieldCheck className={styles.successIcon} size={64} />
            <h2>Thank You!</h2>
            <p>Your feedback has been successfully registered. Together, we make Lagos commuting safer.</p>
          </div>
        )}
      </div>
    </div>
  );
}
