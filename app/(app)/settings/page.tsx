"use client";

import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Sun, 
  Shield, 
  LogOut, 
  User, 
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./settings.module.css";
import { useSettings } from "@/components/providers/ThemeProvider";
import PwaInstallBanner from "@/components/features/PwaInstallBanner";
import { safeLocalStorage } from "@/lib/storage";

export default function SettingsPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getCurrentUser);
  const updateUserSettingsAction = useAction(api.rateLimitedActions.rateLimitedUpdateUserSettings);
  const updateProfile = useMutation(api.users.updateUser);

  const { theme, setTheme, fontSize, setFontSize, privacyMode, setPrivacyMode } = useSettings();
  const { signOut } = useClerk();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Profile Edit States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
        phone: editPhone || undefined,
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

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <main className={styles.container}>
      {/* Settings Header */}
      <header className={styles.settingsHeader}>
        <button className={`${styles.backBtn} backBtn`} onClick={() => router.push("/home")} aria-label="Go back to home">
          <ChevronLeft size={20} />
        </button>
        <h1>Settings</h1>
      </header>

      {/* PWA Install Banner */}
      <PwaInstallBanner />

      {/* User info banner */}
      <div className={styles.userCard}>
        <div className={styles.avatar}>
          <User size={28} />
        </div>
        <div className={styles.userMeta}>
          <h2>{dbUser?.displayName || user?.fullName || "Commuter Profile"}</h2>
          <p>{dbUser?.phone || user?.primaryPhoneNumber?.phoneNumber || "Verified Profile"}</p>
        </div>
      </div>

      {/* CATEGORY 1: GENERAL */}
      <div className={styles.groupSection}>
        <h3 className={styles.groupTitle}>General</h3>
        <div className={styles.cardGroup}>
          {/* Profile Settings */}
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
                  <label>WhatsApp Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    placeholder="8012345678"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    disabled={profileSaving}
                  />
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
        </div>
      </div>

      {/* CATEGORY 2: SECURITY */}
      <div className={styles.groupSection}>
        <h3 className={styles.groupTitle}>Privacy & Security</h3>
        <div className={styles.cardGroup}>
          <div className={styles.rowItem} style={{ alignItems: "flex-start" }}>
            <div className={styles.rowLeft} style={{ alignItems: "flex-start" }}>
              <div className={styles.iconWrapper} style={{ color: "hsl(45, 93%, 47%)", marginTop: "2px" }}>
                <Shield size={20} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span className={styles.rowLabel}>Local Privacy Mode</span>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: "1.4", maxWidth: "220px" }}>
                  Masks plate numbers on your screen so bystanders can't read them over your shoulder.
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
        </div>
      </div>

      {/* CATEGORY 3: LEGAL */}
      <div className={styles.groupSection}>
        <h3 className={styles.groupTitle}>Legal</h3>
        <div className={styles.cardGroup}>
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

      {/* LOG OUT BUTTON */}
      <div className={styles.logoutSection}>
        <button 
          className={styles.logoutBtn} 
          onClick={() => setShowLogoutModal(true)}
          aria-label="Sign out of Route"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>

      {/* Log Out Confirmation Modal */}
      {showLogoutModal && (
        <div className={styles.overlay}>
          <div className={styles.backdrop} onClick={() => setShowLogoutModal(false)} />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <LogOut size={32} className={styles.warningIcon} style={{ color: "var(--color-safety-status-dangerous)" }} />
              <h3>Log Out</h3>
            </div>
            <p className={styles.modalText} style={{ textAlign: "center" }}>
              Are you sure you want to log out of Route?
            </p>
            <div className={styles.modalActions}>
              <button 
                type="button"
                className={styles.logoutConfirmBtn} 
                onClick={async () => {
                  setShowLogoutModal(false);
                  safeLocalStorage.removeItem("route-last-active");
                  await signOut();
                  router.push("/login");
                }}
              >
                Yes, Log Out
              </button>
              <button 
                type="button"
                className={styles.logoutDismissBtn} 
                onClick={() => setShowLogoutModal(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
