"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  Pin,
  Search,
  AlertTriangle,
  ChevronLeft,
  X,
  CheckCircle,
  AlertCircle,
  Car,
  MoreVertical,
  Flag,
  Bookmark,
} from "lucide-react";
import styles from "./saved.module.css";

interface SavedVehicle {
  _id: string;
  plate: string;
  pinned: boolean;
  savedAt: number;
  isOwnFlagged: boolean;
  primaryOffense: string;
  description: string;
  flagCount: number;
  safetyIndicator: "green" | "yellow" | "orange" | "red";
  dangerousStatus: boolean;
  transportType?: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

const getPlateBorderColor = (flagCount?: number) => {
  const count = flagCount ?? 0;
  if (count === 0) return "var(--color-safety-status-safe)";
  if (count === 1 || count === 2) return "var(--color-safety-status-caution)";
  if (count === 3) return "var(--color-safety-status-warning)";
  return "var(--color-safety-status-dangerous)";
};

// ── Compact vehicle card with 3-dot menu ──
function VehicleCard({
  vehicle,
  onUnsave,
  onTogglePin,
  onOpenFlag,
}: {
  vehicle: SavedVehicle;
  onUnsave: (plate: string) => void;
  onTogglePin: (plate: string) => void;
  onOpenFlag: (plate: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const flagCount = vehicle.flagCount ?? 0;
  const isDangerous =
    vehicle.dangerousStatus ||
    vehicle.safetyIndicator === "red" ||
    vehicle.safetyIndicator === "orange";
  const hasFlags = flagCount > 0;

  // Close menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  return (
    <div
      className={styles.compactCard}
      style={vehicle.pinned ? { borderLeft: "4px solid #10b981" } : undefined}
    >
      {/* Flag chip — hangs off top-right corner */}
      {hasFlags && (
        <div className={`${styles.flagChip} ${isDangerous ? styles.flagChipRed : styles.flagChipYellow}`}>
          {isDangerous ? (
            <>
              <span className={styles.flagDot} />
              Dangerous
            </>
          ) : (
            <>
              <Flag size={10} />
              {flagCount} flag{flagCount > 1 ? "s" : ""}
            </>
          )}
        </div>
      )}

      {/* Card row: plate info + 3-dot menu */}
      <div className={styles.compactCardRow}>
        {/* Plate display — styled plate container with dynamic border color */}
        <div 
          className={styles.plateContainer}
          style={{ borderColor: getPlateBorderColor(vehicle.flagCount) }}
        >
          <span className={styles.plateLagosText}>Lagos</span>
          <span className={styles.plateNumber}>{vehicle.plate}</span>
        </div>

        {/* 3-dot menu */}
        <div className={styles.dotMenuWrapper} ref={menuRef}>
          <button
            type="button"
            className={styles.dotMenuBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Card options"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div className={styles.dotMenu}>
              <button
                type="button"
                className={styles.dotMenuItem}
                onClick={() => { onTogglePin(vehicle.plate); setMenuOpen(false); }}
              >
                <Pin size={13} style={{ fill: vehicle.pinned ? "currentColor" : "none" }} />
                {vehicle.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                className={styles.dotMenuItem}
                onClick={() => { onOpenFlag(vehicle.plate); setMenuOpen(false); }}
              >
                <Flag size={13} />
                Flag
              </button>
              <button
                type="button"
                className={`${styles.dotMenuItem} ${styles.dotMenuItemDanger}`}
                onClick={() => { onUnsave(vehicle.plate); setMenuOpen(false); }}
              >
                <Bookmark size={13} />
                Unbookmark
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status line below plate */}
      {isDangerous ? (
        <div className={styles.dangerousStrip}>
          <span className={styles.dangerDot} />
          Vehicle escalated — multiple safety concerns reported
        </div>
      ) : !hasFlags ? (
        <p className={styles.noFlagMemo}>
          This vehicle has not been flagged by any commuters.
        </p>
      ) : (
        <p className={styles.vigilantMemo}>
          ⚠️ {flagCount} flag report{flagCount > 1 ? "s" : ""} from commuters — stay alert.
        </p>
      )}
    </div>
  );
}


export default function SavedPage() {
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);
  const [cachedList, setCachedList] = useState<SavedVehicle[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "pinned">("all");

  // Flag modal state (opens home-style flag modal via router or inline)
  const [flagTargetPlate, setFlagTargetPlate] = useState("");
  const [showFlagToast, setShowFlagToast] = useState(false);

  const convexList = useQuery(api.vehicles.getSavedVehicles);
  const unsaveVehicle = useAction(api.rateLimitedActions.rateLimitedUnsaveVehicle);
  const togglePinVehicle = useAction(api.rateLimitedActions.rateLimitedTogglePinVehicle);
  const flagVehicleWithReport = useAction(api.rateLimitedActions.rateLimitedFlagVehicleWithReport);

  // Flag form state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagVehicleType, setFlagVehicleType] = useState("");
  const [flagLocation, setFlagLocation] = useState("");
  const [flagTime, setFlagTime] = useState("");
  const [flagIncidentType, setFlagIncidentType] = useState("");
  const [flagCustomIncident, setFlagCustomIncident] = useState("");
  const [flagDescription, setFlagDescription] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  const INCIDENT_TYPES = [
    "Robbery / One-chance",
    "Route deviation",
    "Threatening behaviour",
    "Reckless driving",
    "Verbal harassment",
    "Sexual harassment",
    "Overcharging / Extortion",
    "Driver under influence",
    "Suspicious passenger behaviour",
    "Other (describe below)",
  ];

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    fetch("/api/saved-vehicles")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setCachedList(json.data);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const getCleanError = (err: any): string => {
    let msg = err.message || "Failed to complete action.";
    if (msg.includes("ConvexError:")) msg = msg.split("ConvexError:").pop()?.trim() ?? msg;
    return msg;
  };

  const handleUnsave = async (plate: string) => {
    if (isOffline) { addToast("You are offline. Cannot change bookmark status.", "error"); return; }
    try {
      await unsaveVehicle({ plate });
      addToast(`${plate} removed from bookmarks.`, "success");
    } catch (err: any) { addToast(getCleanError(err), "error"); }
  };

  const handleTogglePin = async (plate: string) => {
    if (isOffline) { addToast("You are offline. Pin modifications disabled.", "error"); return; }
    try {
      const result = await togglePinVehicle({ plate });
      addToast(result.pinned ? `${plate} pinned.` : `${plate} unpinned.`, "success");
    } catch (err: any) { addToast(getCleanError(err), "error"); }
  };

  const openFlagModal = (plate: string) => {
    setFlagTargetPlate(plate);
    setFlagVehicleType("");
    setFlagLocation("");
    setFlagTime("");
    setFlagIncidentType("");
    setFlagCustomIncident("");
    setFlagDescription("");
    setShowFlagModal(true);
  };

  const handleFlagSubmit = async () => {
    if (!flagVehicleType || !flagLocation || !flagTime || !flagIncidentType) {
      addToast("Please fill in all required fields.", "error");
      return;
    }
    const resolvedIncidentType =
      flagIncidentType === "Other (describe below)"
        ? flagCustomIncident.trim() || "Other"
        : flagIncidentType;
    setFlagSubmitting(true);
    try {
      await flagVehicleWithReport({
        plate: flagTargetPlate,
        vehicleType: flagVehicleType,
        location: flagLocation,
        time: flagTime,
        incidentType: resolvedIncidentType,
        description: flagDescription.trim() || undefined,
      });
      addToast("Report submitted. Thank you for keeping the community safe.", "success");
      setShowFlagModal(false);
    } catch (err: any) {
      addToast(getCleanError(err), "error");
    } finally {
      setFlagSubmitting(false);
    }
  };

  const displayList = convexList !== undefined ? convexList : cachedList;

  const filteredList = (displayList || []).filter((v) =>
    v.plate.toLowerCase().includes(searchQuery.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
  );

  const pinnedList = filteredList.filter((v) => v.pinned);
  const activeList = filterMode === "pinned" ? pinnedList : filteredList;

  return (
    <main className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <button
            className={`${styles.backBtn} backBtn`}
            onClick={() => router.push("/home")}
            aria-label="Go back to home"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className={styles.title}>My Bookmarks</h1>
          <div style={{ width: 44 }} />
        </div>
      </header>

      {/* Offline Alert */}
      {isOffline && (
        <div className={styles.offlineBanner}>
          <AlertTriangle className={styles.offlineBannerIcon} size={24} />
          <div>
            <div className={styles.offlineBannerTitle}>Offline Mode Active</div>
            <div className={styles.offlineBannerText}>
              Using locally cached data. Modifying bookmarks is disabled until you reconnect.
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          placeholder="Filter bookmarked plates..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      {displayList !== null && (
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterTab} ${filterMode === "all" ? styles.filterTabActive : ""}`}
            onClick={() => setFilterMode("all")}
          >
            All ({filteredList.length})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${filterMode === "pinned" ? styles.filterTabActive : ""}`}
            onClick={() => setFilterMode("pinned")}
          >
            <Pin size={13} style={{ fill: filterMode === "pinned" ? "currentColor" : "none", marginRight: 4 }} />
            Pinned ({pinnedList.length})
          </button>
        </div>
      )}

      {/* Card List */}
      {displayList === null && convexList === undefined ? null : activeList.length === 0 ? (
        <div className={styles.emptyState}>
          <Car className={styles.emptyIcon} size={44} />
          <h3>{filterMode === "pinned" ? "No Pinned Vehicles" : "No Bookmarked Vehicles"}</h3>
          <p>
            {filterMode === "pinned"
              ? "Pin a vehicle from the 3-dot menu to see it here."
              : searchQuery
              ? "No bookmarks match your filter."
              : "Vehicles you bookmark will appear here."}
          </p>
        </div>
      ) : (
        <div className={styles.compactGrid}>
          {activeList.map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              onUnsave={handleUnsave}
              onTogglePin={handleTogglePin}
              onOpenFlag={openFlagModal}
            />
          ))}
        </div>
      )}

      {/* FLAG REPORT MODAL */}
      {showFlagModal && (
        <div className={styles.flagModalOverlay} onClick={() => setShowFlagModal(false)}>
          <div className={styles.flagModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.flagModalHeader}>
              <h3>Report Vehicle</h3>
              <button
                type="button"
                className={styles.flagModalClose}
                onClick={() => setShowFlagModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p className={styles.flagModalPlate}>{flagTargetPlate}</p>

            <div className={styles.flagModalBody}>
              <div className={styles.flagField}>
                <label className={styles.flagLabel}>Vehicle Type *</label>
                <select className={styles.flagSelect} value={flagVehicleType} onChange={(e) => setFlagVehicleType(e.target.value)}>
                  <option value="">Select vehicle type...</option>
                  <option>Danfo</option>
                  <option>Keke</option>
                  <option>Okada</option>
                  <option>Taxi (Personal)</option>
                  <option>Uber / Bolt</option>
                  <option>Shuttle</option>
                  <option>Other</option>
                </select>
              </div>

              <div className={styles.flagField}>
                <label className={styles.flagLabel}>Where did this happen? *</label>
                <input type="text" className={styles.flagInput} placeholder="e.g. Oshodi Under Bridge, Lagos" value={flagLocation} onChange={(e) => setFlagLocation(e.target.value.slice(0, 150))} />
              </div>

              <div className={styles.flagField}>
                <label className={styles.flagLabel}>When did this happen? *</label>
                <input type="text" className={styles.flagInput} placeholder="e.g. Monday 3pm, or Yesterday evening" value={flagTime} onChange={(e) => setFlagTime(e.target.value.slice(0, 50))} />
              </div>

              <div className={styles.flagField}>
                <label className={styles.flagLabel}>Type of incident *</label>
                <select className={styles.flagSelect} value={flagIncidentType} onChange={(e) => setFlagIncidentType(e.target.value)}>
                  <option value="">Select incident type...</option>
                  {INCIDENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              {flagIncidentType === "Other (describe below)" && (
                <div className={styles.flagField}>
                  <label className={styles.flagLabel}>Describe the incident type</label>
                  <input type="text" className={styles.flagInput} placeholder="Brief label" value={flagCustomIncident} onChange={(e) => setFlagCustomIncident(e.target.value.slice(0, 100))} />
                </div>
              )}

              <div className={styles.flagField}>
                <label className={styles.flagLabel}>What happened? (optional)</label>
                <textarea className={styles.flagTextarea} placeholder="Describe what happened so other commuters are aware..." rows={4} value={flagDescription} onChange={(e) => setFlagDescription(e.target.value.slice(0, 500))} />
                <span className={styles.flagCharCount}>{flagDescription.length}/500</span>
              </div>
            </div>

            <button type="button" className={styles.flagSubmitBtn} onClick={handleFlagSubmit} disabled={flagSubmitting}>
              {flagSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
            <div className={styles.toastIcon}>
              {toast.type === "success" ? <CheckCircle size={18} style={{ color: "#10b981" }} /> : <AlertCircle size={18} style={{ color: "#ef4444" }} />}
            </div>
            <div className={styles.toastText}>{toast.message}</div>
            <button className={styles.toastClose} onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
