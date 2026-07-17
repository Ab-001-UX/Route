"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { MapPin, Bell, Users, Check, ArrowRight, ChevronLeft, Trash2, Plus, Phone, User, Loader2 } from "lucide-react";
import styles from "./onboarding.module.css";
import { normalizeNigerianPhoneNumber } from "@/lib/validators";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [locationState, setLocationState] = useState<"idle" | "granted" | "denied">("idle");
  const [notificationState, setNotificationState] = useState<"idle" | "granted" | "denied">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Contact state
  const [contactName, setContactName] = useState("");
  const [contactRelation, setContactRelation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [finishLoading, setFinishLoading] = useState(false);

  // Convex Hooks
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createUser = useMutation(api.users.createUser);
  const updateUser = useMutation(api.users.updateUser);
  const addContact = useAction(api.rateLimitedActions.rateLimitedAddContact);
  const removeContact = useMutation(api.contacts.removeContact);
  const contacts = useQuery(api.contacts.getContacts) || [];

  // Returning user guard — if they have fully completed onboarding, skip onboarding.
  // Otherwise, automatically advance to Step 2 if they already have a phone number.
  useEffect(() => {
    if (currentUser !== undefined && currentUser !== null) {
      if (currentUser.displayName) {
        router.replace("/home");
      } else if (!hasAutoAdvanced) {
        if (currentUser.phone) {
          setPhone(currentUser.phone);
        }
        setHasAutoAdvanced(true);
        setStep(2);
      }
    }
  }, [currentUser, router, hasAutoAdvanced]);

  const formatPhoneNumber = (num: string): string => {
    return normalizeNigerianPhoneNumber(num);
  };

  const goBack = () => {
    setErrorMsg("");
    setContactError("");
    if (step > 1) setStep(step - 1);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!isAuthenticated) {
      setErrorMsg("Syncing authentication with server. Please wait a moment and try again.");
      setLoading(false);
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (formattedPhone.length < 14) {
      setErrorMsg("Please enter a valid Nigerian phone number.");
      setLoading(false);
      return;
    }

    try {
      await createUser({ phone: formattedPhone });
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize account.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const requestLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setLocationState("denied");
      setLoading(false);
      setStep(4);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationState("granted");
        setLoading(false);
        setStep(4);
      },
      () => {
        setLocationState("denied");
        setLoading(false);
        setStep(4);
      }
    );
  };

  const requestNotifications = async () => {
    setLoading(true);
    if (!("Notification" in window)) {
      setNotificationState("denied");
      setLoading(false);
      setStep(5);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationState(permission === "granted" ? "granted" : "denied");
    } catch {
      setNotificationState("denied");
    } finally {
      setLoading(false);
      setStep(5);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError("");
    setContactLoading(true);

    const formattedContactPhone = formatPhoneNumber(contactPhone);
    if (formattedContactPhone.length < 14) {
      setContactError("Please enter a valid Nigerian phone number for your contact.");
      setContactLoading(false);
      return;
    }

    try {
      await addContact({
        name: contactName,
        relationship: contactRelation,
        phone: formattedContactPhone,
        email: contactEmail || undefined,
      });

      setContactName("");
      setContactRelation("");
      setContactPhone("");
      setContactEmail("");
    } catch (err: any) {
      setContactError(err.message || "Failed to add contact.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleRemoveContact = async (id: any) => {
    try {
      await removeContact({ contactId: id });
    } catch (err) {
      console.error("Failed to remove contact:", err);
    }
  };

  const handleFinish = async () => {
    if (contacts.length < 2) {
      setContactError("You must add at least 2 emergency contacts to continue.");
      return;
    }
    setFinishLoading(true);
    try {
      await updateUser({ displayName });
      router.push("/home");
    } catch (err: any) {
      setContactError(err.message || "Failed to save profile.");
    } finally {
      setFinishLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.onboardingHeader}>
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
          <div className={styles.headerBottomRow}>
            <div className={styles.backBtnContainer}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className={styles.backBtn}
                  aria-label="Go back"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
            </div>
            <p className={styles.stepIndicator}>Step {step} of 5</p>
          </div>
        </div>
      </header>

      {/* STEP 1: WHATSAPP NUMBER */}
      {step === 1 && (
        <section className={styles.stepContent}>
          <div className={styles.iconContainer}>
            <Phone size={48} className={styles.accentIcon} />
          </div>
          <h1>Enter your WhatsApp number</h1>
          <p>Please provide your active WhatsApp number. This is used to send safety check-in links to your emergency contacts on WhatsApp so they can track your trip and receive notifications.</p>

          {errorMsg && (
            <div className={styles.errorBanner}>
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg("")} className={styles.dismissErrorBtn}>×</button>
            </div>
          )}

          <form onSubmit={handleCreateUser} className={styles.form}>
            <div className={styles.phoneInputContainer}>
              <span className={styles.phonePrefix}>+234</span>
              <input
                type="tel"
                placeholder="8012345678"
                value={phone.startsWith("+234") ? phone.slice(4) : phone.startsWith("234") ? phone.slice(3) : phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (val.startsWith("234")) val = val.slice(3);
                  if (val.startsWith("0")) val = val.slice(1);
                  setPhone("+234" + val);
                }}
                disabled={loading}
                required
              />
            </div>
            <button 
              type="submit" 
              className="primary" 
              disabled={loading || isAuthLoading || !isAuthenticated}
            >
              {isAuthLoading ? (
                <>Syncing Auth <Loader2 className={styles.spin} size={18} /></>
              ) : loading ? (
                <Loader2 className={styles.spin} size={18} />
              ) : (
                <>Continue <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </section>
      )}

      {/* STEP 2: DISPLAY NAME */}
      {step === 2 && (
        <section className={styles.stepContent}>
          <div className={styles.iconContainer}>
            <User size={48} className={styles.accentIcon} />
          </div>
          <h1>What should we call you?</h1>
          <p>Your display name helps emergency contacts recognise you instantly.</p>

          <form onSubmit={handleUpdateName} className={styles.form}>
            <input
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              required
            />
            <button type="submit" className="primary">
              Continue <ArrowRight size={18} />
            </button>
          </form>
        </section>
      )}

      {/* STEP 3: GEOLOCATION ACCESS */}
      {step === 3 && (
        <section className={styles.stepContent}>
          <div className={styles.iconContainer}>
            <MapPin size={48} className={styles.accentIcon} />
          </div>
          <h1>Enable Geolocation</h1>
          <p>Route collects coordinates periodically during active trips to keep your emergency contacts updated in case of delays or emergencies.</p>

          <div className={styles.actions}>
            <button onClick={requestLocation} className="primary" disabled={loading}>
              {loading ? <Loader2 className={styles.spin} size={18} /> : "Grant Location Access"}
            </button>
            <button onClick={() => setStep(4)} className="secondary" disabled={loading}>
              Skip for now
            </button>
          </div>
        </section>
      )}

      {/* STEP 4: NOTIFICATIONS ACCESS */}
      {step === 4 && (
        <section className={styles.stepContent}>
          <div className={styles.iconContainer}>
            <Bell size={48} className={styles.accentIcon} />
          </div>
          <h1>Enable Notifications</h1>
          <p>Receive safety check prompts, transit alerts, and check-in timer updates.</p>

          <div className={styles.actions}>
            <button onClick={requestNotifications} className="primary" disabled={loading}>
              {loading ? <Loader2 className={styles.spin} size={18} /> : "Enable Push Notifications"}
            </button>
            <button onClick={() => setStep(5)} className="secondary" disabled={loading}>
              Skip for now
            </button>
          </div>
        </section>
      )}

      {/* STEP 5: TRUSTED CONTACTS & FINISH */}
      {step === 5 && (
        <section className={styles.stepContent}>
          <div className={styles.contactsHeader}>
            <Users size={32} className={styles.accentIconSmall} />
            <h2>Add Emergency Contacts</h2>
            <p>You must add between 2 to 5 emergency contacts. The system will alert them when you board a vehicle.</p>
          </div>

          {contactError && (
            <div className={styles.errorBanner}>
              <span>{contactError}</span>
              <button type="button" onClick={() => setContactError("")} className={styles.dismissErrorBtn}>×</button>
            </div>
          )}

          <form onSubmit={handleAddContact} className={styles.contactForm}>
            <input
              type="text"
              placeholder="Full name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              disabled={contactLoading || contacts.length >= 5}
              className={styles.smallInput}
            />
            <input
              type="text"
              placeholder="Relationship (e.g. Sister)"
              value={contactRelation}
              onChange={(e) => setContactRelation(e.target.value)}
              required
              disabled={contactLoading || contacts.length >= 5}
              className={styles.smallInput}
            />
            <div className={styles.phoneInputContainer}>
              <span className={styles.phonePrefix}>+234</span>
              <input
                type="tel"
                placeholder="8012345678"
                value={contactPhone.startsWith("+234") ? contactPhone.slice(4) : contactPhone.startsWith("234") ? contactPhone.slice(3) : contactPhone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (val.startsWith("234")) val = val.slice(3);
                  if (val.startsWith("0")) val = val.slice(1);
                  setContactPhone("+234" + val);
                }}
                required
                disabled={contactLoading || contacts.length >= 5}
              />
            </div>
            <input
              type="email"
              placeholder="Email (optional)"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={contactLoading || contacts.length >= 5}
              className={styles.smallInput}
            />
            <button
              type="submit"
              className="primary"
              disabled={contactLoading || contacts.length >= 5}
            >
              {contactLoading
                ? <Loader2 className={styles.spin} size={18} />
                : <><Plus size={16} /> Add Contact</>}
            </button>
          </form>

          {/* Added contacts list */}
          {contacts.length > 0 && (
            <div className={styles.contactsList}>
              <h3>Your Contacts ({contacts.length}/5)</h3>
              <div className={styles.contactsGrid}>
                {contacts.map((c) => (
                  <div key={c._id} className={styles.contactCard}>
                    <div className={styles.contactDetails}>
                      <h4>{c.name}</h4>
                      <p>{c.relationship} • {c.phone}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveContact(c._id)}
                      className={styles.deleteBtn}
                      aria-label="Remove contact"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finish Setup — lives inside the page, below contacts */}
          <button
            onClick={handleFinish}
            className="primary"
            disabled={contacts.length < 2 || finishLoading}
            style={{ marginTop: "var(--spacing-lg)" }}
          >
            {finishLoading
              ? <Loader2 className={styles.spin} size={18} />
              : <>Finish Setup <Check size={18} /></>}
          </button>
        </section>
      )}
    </main>
  );
}
