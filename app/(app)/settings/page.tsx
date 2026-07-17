"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Bell, 
  Sun, 
  Globe, 
  Shield, 
  Users, 
  Lock, 
  Award, 
  LogOut, 
  User, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldAlert,
  Loader2,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./settings.module.css";
import { useSettings } from "@/components/providers/ThemeProvider";
import { normalizeNigerianPhoneNumber } from "@/lib/validators";

export default function SettingsPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getCurrentUser);
  const contacts = useQuery(api.contacts.getContacts) || [];
  const addContact = useAction(api.rateLimitedActions.rateLimitedAddContact);
  const removeContact = useMutation(api.contacts.removeContact);
  const resendInvite = useAction(api.rateLimitedActions.rateLimitedResendInvite);
  const updateProfile = useMutation(api.users.updateUser);

  const { theme, setTheme, fontSize, setFontSize, privacyMode, setPrivacyMode } = useSettings();
  const router = useRouter();

  // Accordion active rows states
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Auto-open section if 'open' query param is passed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("open") === "contacts") {
        setActiveSection("contacts");
      }
    }
  }, []);

  // Profile Edit States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  useEffect(() => {
    if (dbUser) {
      setEditName(dbUser.displayName || "");
      setEditPhone(dbUser.phone || "");
    }
  }, [dbUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!editName.trim()) {
      setProfileError("Display name is required.");
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({
        displayName: editName.trim(),
        phone: editPhone,
      });
      setProfileSuccess("Profile updated successfully!");
    } catch (err: any) {
      let msg = err.message || "Failed to update profile.";
      if (msg.includes("ConvexError:")) {
        msg = msg.split("ConvexError:")[1].trim();
      }
      setProfileError(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any>(null);

  // Clipboard share states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null);

  // SOS Emergency States & Handlers
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState("");
  const [sosError, setSosError] = useState("");
  const [locationCopied, setLocationCopied] = useState(false);

  const handleTriggerQuickSOS = () => {
    setSosError("");
    setSosSuccess("");
    const activeContacts = contacts.filter((c) => c.status === "active");
    if (activeContacts.length === 0) {
      setSosError("You need at least one Active emergency contact to trigger SOS.");
      return;
    }

    if (!confirm("Are you sure you want to trigger a Quick SOS? This will immediately alert your emergency contacts.")) {
      return;
    }

    setSosLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch("/api/trips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plate: "SOS-PANIC",
              transportType: "SOS",
              boardingLocation: "Emergency SOS Panic Trigger",
              lat: latitude,
              lng: longitude,
              durationMinutes: 15,
              safetyContactId: activeContacts[0]._id,
              alertContactIds: activeContacts.map((c) => c._id),
              description: "Emergency SOS Panic alert triggered directly from Settings screen.",
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setSosSuccess("SOS Alert triggered! Contacts have been notified.");
          } else {
            setSosError(data.message || "Failed to trigger SOS alert.");
          }
        } catch (err: any) {
          setSosError("Failed to trigger SOS alert. Check your network.");
        } finally {
          setSosLoading(false);
        }
      },
      async (error) => {
        try {
          const res = await fetch("/api/trips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plate: "SOS-PANIC",
              transportType: "SOS",
              boardingLocation: "Emergency SOS Panic Trigger (No GPS)",
              lat: 6.5244,
              lng: 3.3792,
              durationMinutes: 15,
              safetyContactId: activeContacts[0]._id,
              alertContactIds: activeContacts.map((c) => c._id),
              description: "Emergency SOS Panic alert triggered directly from Settings screen. GPS access denied.",
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setSosSuccess("SOS Alert triggered (using default city location)!");
          } else {
            setSosError(data.message || "Failed to trigger SOS alert.");
          }
        } catch (err: any) {
          setSosError("Failed to trigger SOS alert.");
        } finally {
          setSosLoading(false);
        }
      },
      { timeout: 8000 }
    );
  };

  const handleShareLocation = () => {
    setSosError("");
    setSosSuccess("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        const messageText = `Emergency Safety Alert from Route: I am sharing my live location coordinates: ${mapLink}`;
        
        navigator.clipboard.writeText(messageText);
        setLocationCopied(true);
        setSosSuccess("Location link copied to clipboard!");
        setTimeout(() => setLocationCopied(false), 3000);
      },
      (error) => {
        setSosError("Could not access location. Please check your browser permissions.");
      }
    );
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalized = normalizeNigerianPhoneNumber(phone);
      if (!/^\+234[789]\d{9}$/.test(normalized)) {
        setError("Invalid phone number. Please enter a valid 10-digit number starting with 7, 8, or 9 (e.g., 803 123 4567).");
        setLoading(false);
        return;
      }

      const result = await addContact({
        name,
        relationship,
        phone: normalized,
        email: email || undefined,
      });

      // Construct invite link
      const inviteUrl = `${window.location.origin}/contact-activation/${result.token}`;
      setLastGeneratedUrl(inviteUrl);
      
      // Clear inputs
      setName("");
      setRelationship("");
      setPhone("");
      setEmail("");
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to add contact.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (id: any) => {
    setContactToDelete(id);
    setShowDeleteWarning(true);
  };

  const proceedDeleteContact = async () => {
    if (!contactToDelete) return;
    try {
      await removeContact({ contactId: contactToDelete });
    } catch (err) {
      console.error("Failed to remove contact:", err);
    } finally {
      setShowDeleteWarning(false);
      setContactToDelete(null);
    }
  };

  const handleResend = async (id: any) => {
    try {
      const result = await resendInvite({ contactId: id });
      const inviteUrl = `${window.location.origin}/contact-activation/${result.token}`;
      
      // Copy directly to clipboard
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
      
      alert("New invite link generated and copied to clipboard! Share it with your contact via WhatsApp.");
    } catch (err) {
      console.error("Failed to regenerate invite link:", err);
    }
  };

  const copyUrl = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };


  return (
    <main className={styles.container}>
      {/* Settings Header (Styled exactly like screenshot) */}
      <header className={styles.settingsHeader}>
        <button className={`${styles.backBtn} backBtn`} onClick={() => router.push("/home")} aria-label="Go back to home">
          <ChevronLeft size={20} />
        </button>
        <h1>Settings</h1>
      </header>

      {/* User info banner */}
      <div className={styles.userCard}>
        <div className={styles.avatar}>
          <User size={28} />
        </div>
        <div className={styles.userMeta}>
          <h2>{dbUser?.displayName || user?.fullName || "Commuter Profile"}</h2>
          <p>{dbUser?.phone || user?.primaryPhoneNumber?.phoneNumber || "Phone verified"}</p>
        </div>
      </div>

      {/* Shareable Activation URL notifier */}
      {lastGeneratedUrl && (
        <section className={styles.successNotification}>
          <h4>Contact Added!</h4>
          <p>Copy and send this invite link manually to your contact via WhatsApp:</p>
          <div className={styles.linkShare}>
            <input type="text" readOnly value={lastGeneratedUrl} />
            <button
              onClick={() => copyUrl(lastGeneratedUrl, "new")}
              className="primary"
              style={{ minWidth: "40px", minHeight: "40px", padding: 0 }}
            >
              {copiedId === "new" ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <button onClick={() => setLastGeneratedUrl(null)} className={styles.closeNotification}>
            Dismiss
          </button>
        </section>
      )}

      {/* CATEGORY 1: GENERAL */}
      <div className={styles.groupSection}>
        <h3 className={styles.groupTitle}>General</h3>
        <div className={styles.cardGroup}>
          {/* Profile Settings Accordion Row */}
          <div className={styles.rowItem} onClick={() => toggleSection("profile")}>
            <div className={styles.rowLeft}>
              <div className={styles.iconWrapper} style={{ color: "var(--color-brand-primary)" }}>
                <User size={20} />
              </div>
              <span className={styles.rowLabel}>Edit Profile Details</span>
            </div>
            <div className={styles.rowRight}>
              {activeSection === "profile" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
          {activeSection === "profile" && (
            <div className={styles.expandableContent}>
              <form onSubmit={handleUpdateProfile} className={styles.contactForm}>
                {profileError && <div className={styles.errorText} style={{ color: "var(--color-safety-status-dangerous)", fontSize: "12px", marginBottom: "8px" }}>{profileError}</div>}
                {profileSuccess && <div className={styles.successText} style={{ color: "#10b981", fontSize: "12px", marginBottom: "8px" }}>{profileSuccess}</div>}
                
                <div className={styles.formGroup}>
                  <label>Display Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Abimbola"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required 
                    disabled={profileSaving}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>WhatsApp Phone Number</label>
                  <div className={styles.phoneInput}>
                    <span className={styles.phonePrefix}>+234</span>
                    <input 
                      type="tel" 
                      placeholder="8012345678"
                      value={editPhone.startsWith("+234") ? editPhone.slice(4) : editPhone.startsWith("234") ? editPhone.slice(3) : editPhone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.startsWith("234")) val = val.slice(3);
                        if (val.startsWith("0")) val = val.slice(1);
                        setEditPhone("+234" + val);
                      }}
                      required 
                      disabled={profileSaving}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="primary" 
                  disabled={profileSaving}
                  style={{ width: "100%", marginTop: "12px", minHeight: "44px" }}
                >
                  {profileSaving ? (
                    <>
                      <Loader2 className={styles.spin} size={16} style={{ marginRight: "6px" }} /> Saving...
                    </>
                  ) : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* Notifications Accordion Row */}
          <div className={styles.rowItem} onClick={() => toggleSection("notifications")}>
            <div className={styles.rowLeft}>
              <div className={styles.iconWrapper} style={{ color: "hsl(25, 95%, 53%)" }}>
                <Bell size={20} />
              </div>
              <span className={styles.rowLabel}>Notifications</span>
            </div>
            <div className={styles.rowRight}>
              {activeSection === "notifications" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
          {activeSection === "notifications" && (
            <div className={styles.expandableContent}>
              <h4>Emergency Ride Notifications</h4>
              <p style={{ margin: "0", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                Route pushes safety check-ins and emergency alerts directly to your Active contacts. You can manage who receives notifications in the **Trusted Contacts** section under Security.
              </p>
            </div>
          )}

          {/* Appearance Accordion Row */}
          <div className={styles.rowItem} onClick={() => toggleSection("appearance")}>
            <div className={styles.rowLeft}>
              <div className={styles.iconWrapper} style={{ color: "hsl(142, 71%, 45%)" }}>
                <Sun size={20} />
              </div>
              <span className={styles.rowLabel}>Appearance</span>
            </div>
            <div className={styles.rowRight}>
              {activeSection === "appearance" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
          {activeSection === "appearance" && (
            <div className={styles.expandableContent}>
              <div className={styles.optionBox}>
                {/* Theme Selector */}
                <div className={styles.optionBlock}>
                  <label>App Theme</label>
                  <div className={styles.buttonGroup}>
                    <button 
                      className={theme === "light" ? styles.active : ""} 
                      onClick={() => setTheme("light")}
                    >
                      Light Mode
                    </button>
                    <button 
                      className={theme === "dark" ? styles.active : ""} 
                      onClick={() => setTheme("dark")}
                    >
                      Dark Mode
                    </button>
                  </div>
                </div>

                {/* Font Size Selector */}
                <div className={styles.optionBlock}>
                  <label>Text Scaling</label>
                  <div className={styles.buttonGroup}>
                    <button 
                      className={fontSize === "default" ? styles.active : ""} 
                      onClick={() => setFontSize("default")}
                    >
                      Default
                    </button>
                    <button 
                      className={fontSize === "large" ? styles.active : ""} 
                      onClick={() => setFontSize("large")}
                    >
                      Large
                    </button>
                    <button 
                      className={fontSize === "extra-large" ? styles.active : ""} 
                      onClick={() => setFontSize("extra-large")}
                    >
                      XL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Language Selector Row */}
          <div className={styles.rowItem} onClick={() => toggleSection("language")}>
            <div className={styles.rowLeft}>
              <div className={styles.iconWrapper} style={{ color: "var(--color-brand-primary)" }}>
                <Globe size={20} />
              </div>
              <span className={styles.rowLabel}>Language</span>
            </div>
            <div className={styles.rowRight}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginRight: "8px" }}>English (NG)</span>
              {activeSection === "language" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
          {activeSection === "language" && (
            <div className={styles.expandableContent}>
              <p style={{ margin: "0", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                Route currently supports English (Nigeria) optimized for Lagos State locations. More regional diallects coming soon.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY 2: SECURITY */}
      <div className={styles.groupSection}>
        <h3 className={styles.groupTitle}>Security & Safety</h3>
        <div className={styles.cardGroup}>
          {/* Local Privacy Mode (Toggle switch directly in row like screenshot) */}
          <div className={styles.rowItem} style={{ alignItems: "flex-start" }}>
            <div className={styles.rowLeft} style={{ alignItems: "flex-start" }}>
              <div className={styles.iconWrapper} style={{ color: "hsl(45, 93%, 47%)", marginTop: "2px" }}>
                <Shield size={20} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span className={styles.rowLabel}>Local Privacy Mode</span>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: "1.4", maxWidth: "220px" }}>
                  Masks plate numbers and hides location on your screen so bystanders can't see them. Emergency contacts still get full details.
                </span>
              </div>
            </div>
            <div className={styles.rowRight} style={{ marginTop: "4px" }}>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={privacyMode} 
                  onChange={(e) => setPrivacyMode(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          {/* Trusted Contacts Manager Accordion Row */}
          <div className={styles.rowItem} onClick={() => toggleSection("contacts")}>
            <div className={styles.rowLeft}>
              <div className={styles.iconWrapper} style={{ color: "hsl(0, 72%, 51%)" }}>
                <Users size={20} />
              </div>
              <span className={styles.rowLabel}>Trusted Contacts ({contacts.length}/5)</span>
            </div>
            <div className={styles.rowRight}>
              {activeSection === "contacts" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
          {activeSection === "contacts" && (
            <div className={styles.expandableContent}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ margin: 0 }}>Trusted Emergency Contacts</h4>
                {contacts.length < 5 && !showAddForm && (
                  <button 
                    onClick={() => setShowAddForm(true)} 
                    className="secondary"
                    style={{ minHeight: "28px", padding: "0 10px", fontSize: "12px", borderRadius: "8px" }}
                  >
                    <Plus size={14} style={{ marginRight: "4px" }} /> Add
                  </button>
                )}
              </div>

              {/* Add form inside Settings */}
              {showAddForm && (
                <form onSubmit={handleAddContact} className={styles.contactForm}>
                  {error && <div className={styles.errorText} style={{ color: "var(--color-safety-status-dangerous)", fontSize: "12px" }}>{error}</div>}
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Relationship</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sister, Driver"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      required 
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <div className={styles.phoneInput}>
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
                        required 
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email (Optional)</label>
                    <input 
                      type="email" 
                      placeholder="contact@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className="primary" disabled={loading}>
                      {loading ? "Saving..." : "Generate Invite"}
                    </button>
                    <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Contacts list inline */}
              <div className={styles.contactsList}>
                {contacts.length === 0 ? (
                  <p style={{ margin: "0", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    You have no active emergency contacts configured. You need at least 2 to log trips.
                  </p>
                ) : (
                  contacts.map((c) => (
                    <div key={c._id} className={styles.contactCard}>
                      <div className={styles.contactInfo}>
                        <h5>{c.name}</h5>
                        <p>{c.relationship} • {c.phone}</p>
                        <div className={styles.contactMeta}>
                          <span className={`${styles.statusBadge} ${styles[c.status]}`}>
                            {c.status}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                            RR: {c.responseRate}%
                          </span>
                        </div>
                      </div>
                      <div className={styles.contactActions}>
                        <button onClick={() => handleResend(c._id)} title="Copy WhatsApp invite link">
                          {copiedId === c._id ? <Check size={14} /> : <RefreshCw size={14} />}
                        </button>
                        <button onClick={() => handleRemove(c._id)} className={styles.deleteBtn} title="Remove contact">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Emergency SOS Panic Accordion Row */}
          <div className={styles.rowItem} onClick={() => toggleSection("sos-panel")}>
            <div className={styles.rowLeft}>
              <div className={styles.iconWrapper} style={{ color: "hsl(0, 72%, 51%)" }}>
                <ShieldAlert size={20} />
              </div>
              <span className={styles.rowLabel}>Emergency SOS Panel</span>
            </div>
            <div className={styles.rowRight}>
              {activeSection === "sos-panel" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
          {activeSection === "sos-panel" && (
            <div className={styles.expandableContent}>
              <h4>SOS Panic Alerts</h4>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                Triggering the SOS alert immediately broadcasts your live location and vehicle status to all your trusted safety contacts. Please use this strictly in an active emergency.
              </p>

              {sosSuccess && (
                <div className={styles.emergencySuccessBanner}>
                  <CheckCircle size={14} style={{ color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ flex: 1 }}>{sosSuccess}</span>
                  <button
                    type="button"
                    className={styles.bannerCloseBtn}
                    onClick={() => setSosSuccess("")}
                    aria-label="Close"
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {sosError && (
                <div className={styles.emergencyErrorBanner}>
                  <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ flex: 1 }}>{sosError}</span>
                  <button
                    type="button"
                    className={styles.bannerCloseBtn}
                    onClick={() => setSosError("")}
                    aria-label="Close"
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleTriggerQuickSOS}
                  disabled={sosLoading}
                  className="primary"
                  style={{
                    flex: 1.2,
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "750",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  {sosLoading ? <Loader2 className={styles.spin} size={16} /> : <span>🚨 Trigger SOS</span>}
                </button>
                <button
                  onClick={handleShareLocation}
                  className="secondary"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  {locationCopied ? <Check size={16} /> : <span>🔗 Share GPS Link</span>}
                </button>
              </div>
            </div>
          )}

          {/* Data Security Info Row */}
          <div className={styles.rowItem} onClick={() => toggleSection("security-data")}>
            <div className={styles.rowLeft}>
              <div className={styles.iconWrapper} style={{ color: "var(--color-brand-primary)" }}>
                <Lock size={20} />
              </div>
              <span className={styles.rowLabel}>Data Encryption</span>
            </div>
            <div className={styles.rowRight}>
              {activeSection === "security-data" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
          {activeSection === "security-data" && (
            <div className={styles.expandableContent}>
              <h4>AES-256-GCM End-To-End Security</h4>
              <p style={{ margin: "0", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                Route automatically encrypts all GPS tracking coordinates, safety tokens, and push notification endpoints using AES-256-GCM prior to database write. Decryption occurs strictly on authorized verification check-ins.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY 3: LEGAL */}
      <div className={styles.groupSection}>
        <h3 className={styles.groupTitle}>Legal</h3>
        <div className={styles.cardGroup}>
          {/* Privacy Policy */}
          <div className={styles.rowItem} onClick={() => router.push("/privacy")}>
            <div className={styles.rowLeft}>
              <div className={styles.iconWrapper} style={{ color: "var(--color-text-secondary)" }}>
                <Shield size={20} />
              </div>
              <span className={styles.rowLabel}>Privacy Policy</span>
            </div>
            <div className={styles.rowRight}>
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* LOG OUT BUTTON (At the bottom of the page, styled as premium action in mockup) */}
      <div className={styles.logoutSection}>
        <SignOutButton>
          <button className={styles.logoutBtn} aria-label="Sign out of Route">
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </SignOutButton>
      </div>

      {/* Confirm deletion warnings */}
      {showDeleteWarning && (
        <div className={styles.overlay}>
          <div 
            className={styles.backdrop} 
            onClick={() => {
              setShowDeleteWarning(false);
              setContactToDelete(null);
            }} 
          />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <ShieldAlert size={36} className={styles.warningIcon} />
              <h3>Confirm Deletion</h3>
            </div>
            <p className={styles.modalText}>
              {contacts.length <= 2 ? (
                "Warning: Removing this contact will leave you with fewer than the required 2 active emergency contacts. You won't be able to log any new trips until you add another contact."
              ) : (
                "Are you sure you want to remove this contact? Their access will be immediately and permanently revoked."
              )}
            </p>
            <div className={styles.modalActions}>
              <button
                className="primary"
                onClick={proceedDeleteContact}
              >
                Delete Anyways
              </button>
              <button 
                className="secondary" 
                onClick={() => {
                  setShowDeleteWarning(false);
                  setContactToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
