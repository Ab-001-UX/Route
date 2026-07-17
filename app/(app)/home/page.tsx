"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Bell,
  Search, 
  ShieldCheck, 
  X, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  RefreshCw,
  Pin,
  Bookmark,
  MoreVertical,
  Flag,
  ShieldAlert,
  Mic
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./home.module.css";
import PostRideSurvey from "@/components/features/PostRideSurvey";
import Skeleton from "@/components/ui/Skeleton";
import { trackEvent } from "@/lib/analytics";

interface VehicleData {
  plate: string;
  transportType: string;
  description: string;
  flagCount: number;
  safetyIndicator: "green" | "yellow" | "orange" | "red";
  dangerousStatus: boolean;
  lastFlaggedAt?: number;
}

interface IncidentData {
  _id: string;
  incidentType: string;
  status: string;
  vehicleType?: string;
  location?: string;
  time?: string;
  description?: string;
  createdAt: number;
}

interface SearchResponse {
  vehicle: VehicleData | null;
  incidents: IncidentData[];
}

const commuteGuides = [
  {
    title: "LAGOS DANFO SURVIVAL",
    tag: "Tip #1",
    summary: "Check the inner doors and conductor behavior. Avoid a Danfo if door handles are missing, child locks are active, or they insist on sitting you in the middle seat.",
    detail: "In Lagos, 'One-Chance' syndicates use commercial buses to rob unsuspecting passengers. Always verify the bus is painted yellow with two black stripes. Avoid empty buses displaying suspiciously cheap fares. Prior to sitting, test that the sliding door can easily unlock and open from the inside. If the driver deviates to an unlit bypass, demand to alight immediately at a public checkpoint.",
    illustration: "/illustrations/danfo.png",
    colorClass: "cardOrange"
  },
  {
    title: "KEKE LAYOUT WATCH",
    tag: "Tip #2",
    summary: "Avoid boarding a Keke Napep at night if two men are already in the back seat. Never board if the rider insists on taking unlit, unpaved street bypasses.",
    detail: "Tricycle operators sometimes collude with thieves. Ensure you can see other passengers' faces clearly. Never discuss personal financial details, cash, or transactions inside a Keke. If the driver attempts to deviate into isolated streets or dark alleyways under the guise of avoiding traffic, speak up loudly and ask him to stop at the nearest active intersection.",
    illustration: "/illustrations/keke.png",
    colorClass: "cardYellow"
  },
  {
    title: "OKADA PROFILE CHECKS",
    tag: "Tip #3",
    summary: "Never ride an Okada if the operator wears face-covering hoodies or masks, has no visible license plate, or refuses to follow standard traffic corridors.",
    detail: "Face coverings are a common indicator of operators engaging in street theft or running away from traffic officers. Verify the rider has a clean bike and is willing to stick to major streets. Avoid using bikes late at night in isolated bypass areas or highway underpasses (e.g. parts of Ikorodu Road or Oshodi).",
    illustration: "/illustrations/okada.png",
    colorClass: "cardBlue"
  },
  {
    title: "RIDE-SHARE CASH TRAPS",
    tag: "Tip #4",
    summary: "Always verify the driver's face, vehicle make, and license plate match the app. Cancel the ride immediately if the driver asks you to go off-app or cancel the trip.",
    detail: "Off-app trips remove all GPS logging, safety checks, and emergency safety net triggers from Bolt or Uber. Never board if there is a second person in the car (e.g. 'my friend is just keeping me company'). Keep your window rolled up slightly and share your live location via Route before boarding.",
    illustration: "/illustrations/korope.png",
    colorClass: "cardGreen"
  }
];

export default function HomePage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  const contacts = useQuery(api.contacts.getContacts) || [];
  const hasFewerThanTwoContacts = contacts.length < 2;

  // Live feed and saved lists queries
  const feedList = useQuery(api.vehicles.getHomeFeed);
  const savedList = useQuery(api.vehicles.getSavedVehicles);
  const trips = useQuery(api.trips.getTrips);
  const notifications = useQuery(api.notifications.getNotifications) || [];
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const clearNotification = useMutation(api.notifications.clearNotification);

  const [showNotifications, setShowNotifications] = useState(false);
  const hasUnread = notifications.some((n) => !n.isRead);
  const activeTrip = trips?.find(
    (t) => t.status === "active" || t.status === "pending-review" || t.status === "incident-triggered"
  );
  const savedCount = savedList?.length ?? 0;
  const feedCount = feedList?.length ?? 0;
  const pinnedCount = savedList?.filter((item) => item.pinned).length ?? 0;
  const pinnedVehicles = savedList?.filter((item) => item.pinned) || [];
  const isHomeLoading = feedList === undefined || savedList === undefined || trips === undefined;
  const hasHomeActivity = feedCount > 0 || savedCount > 0 || !!activeTrip;
  const showEmptyHome = !isHomeLoading && !hasHomeActivity;
  const activePreviewVehicles = [
    {
      plate: "KJA 482 QR",
      status: "Watchlist",
      detail: "2 flags",
      note: "Route deviation near Oshodi",
    },
    {
      plate: "APP 193 XY",
      status: "Saved",
      detail: "Pinned",
      note: "Frequently used morning shuttle",
    },
  ];

  // Actions
  const saveVehicle = useAction(api.rateLimitedActions.rateLimitedSaveVehicle);
  const unsaveVehicle = useAction(api.rateLimitedActions.rateLimitedUnsaveVehicle);
  const togglePinVehicle = useAction(api.rateLimitedActions.rateLimitedTogglePinVehicle);
  const flagVehicleWithReport = useAction(api.rateLimitedActions.rateLimitedFlagVehicleWithReport);

  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" }[]>([]);
  const [expandedGuideTitle, setExpandedGuideTitle] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState("");
  const [sosError, setSosError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showResultsMenu, setShowResultsMenu] = useState(false);

  // Flag report modal state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagTargetPlate, setFlagTargetPlate] = useState("");
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

  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSaveToggle = async (plate: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        await unsaveVehicle({ plate });
        addToast(`Vehicle ${plate} removed from saved list.`, "success");
      } else {
        await saveVehicle({ plate });
        addToast(`Vehicle ${plate} saved successfully.`, "success");
      }
    } catch (err: any) {
      addToast(getCleanError(err), "error");
    }
  };

  const handlePinToggle = async (plate: string) => {
    try {
      const result = await togglePinVehicle({ plate });
      if (result.pinned) {
        addToast(`Vehicle ${plate} pinned.`, "success");
      } else {
        addToast(`Vehicle ${plate} unpinned.`, "success");
      }
    } catch (err: any) {
      addToast(getCleanError(err), "error");
    }
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
    setShowMenu(false);
    setShowResultsMenu(false);
  };

  const handleFlagSubmit = async () => {
    if (!flagVehicleType || !flagLocation || !flagTime || !flagIncidentType) {
      addToast("Please fill in all required fields.", "error");
      return;
    }
    const resolvedIncidentType =
      flagIncidentType === "Other (describe below)" ? flagCustomIncident.trim() || "Other" : flagIncidentType;
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

  const getCleanError = (err: any): string => {
    let msg = err.message || "Failed to complete action.";
    if (msg.includes("ConvexError:")) {
      const parts = msg.split("ConvexError:");
      msg = parts[parts.length - 1].trim();
    }
    return msg;
  };

  // Navigation / Wizard UI States:
  // "search" | "voice" | "voice_confirm" | "description" | "banner" | "results"
  const [uiState, setUiState] = useState<"search" | "voice" | "voice_confirm" | "description" | "banner" | "results">("search");

  // Search and Manual Inputs
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Derive 3 most recent completed trips from already-loaded trips data
  const recentTrips = (trips ?? [])
    .filter((t) => t.status !== "active")
    .slice(0, 3);
  
  // Web Speech API processing states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [voiceResult, setVoiceResult] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");

  // Description input states (Wizard Step 2)
  const [transportType, setTransportType] = useState("Uber/Bolt");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleWindows, setVehicleWindows] = useState("");
  const [vehicleCondition, setVehicleCondition] = useState("");

  // Results State
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchedPlate, setSearchedPlate] = useState("");

  // Check if searched plate is saved/pinned
  const isSearchedSaved = savedList?.some((item) => item.plate.trim() === searchedPlate.trim()) ?? false;
  const isSearchedPinned = savedList?.find((item) => item.plate.trim() === searchedPlate.trim())?.pinned ?? false;

  // Helper to normalize input plates (alphanumeric + spaces + dashes, max 15 characters)
  const cleanPlateInput = (val: string) => {
    return val.replace(/[^a-zA-Z0-9 -]/g, "").toUpperCase().slice(0, 15);
  };

  useEffect(() => {
    if (uiState !== "search") {
      document.body.classList.add("hide-nav-bar");
    } else {
      document.body.classList.remove("hide-nav-bar");
    }
    return () => {
      document.body.classList.remove("hide-nav-bar");
    };
  }, [uiState]);



  // When navigated from /trip with ?action=voice, auto-trigger speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "voice" || params.get("action") === "camera") {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          startListening();
        }, 500);
      }
      
      // Load recent searches from localStorage
      const saved = localStorage.getItem("route-recent-searches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse recent searches", e);
        }
      }
    }
  }, []);

  const clearRecentSearches = () => {
    localStorage.removeItem("route-recent-searches");
    setRecentSearches([]);
  };

  const removeRecentSearch = (plateToRemove: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((p) => p !== plateToRemove);
      localStorage.setItem("route-recent-searches", JSON.stringify(next));
      return next;
    });
  };

  const handleTriggerQuickSOS = () => {
    setSosError("");
    setSosSuccess("");
    const activeContacts = contacts.filter((c) => c.status === "active");
    if (activeContacts.length === 0) {
      setSosError("You need at least one Active emergency contact to trigger SOS.");
      addToast("Add active emergency contacts first!", "error");
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
              destination: "Emergency Rescue Location",
              lat: latitude,
              lng: longitude,
              durationMinutes: 15,
              safetyContactId: activeContacts[0]._id,
              alertContactIds: activeContacts.map((c) => c._id),
              description: "Emergency SOS Panic alert triggered directly from Home dashboard.",
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setSosSuccess("SOS Alert triggered! Contacts have been notified.");
            addToast("SOS Alert triggered successfully!", "success");
          } else {
            setSosError(data.message || "Failed to trigger SOS alert.");
            addToast(data.message || "Failed to trigger SOS alert.", "error");
          }
        } catch (err: any) {
          setSosError("Failed to trigger SOS alert. Check your network.");
          addToast("Failed to trigger SOS alert. Check your network.", "error");
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
              destination: "Emergency Rescue Location",
              lat: 6.5244,
              lng: 3.3792,
              durationMinutes: 15,
              safetyContactId: activeContacts[0]._id,
              alertContactIds: activeContacts.map((c) => c._id),
              description: "Emergency SOS Panic alert triggered directly from Home dashboard. GPS access denied.",
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setSosSuccess("SOS Alert triggered (using default city location)!");
            addToast("SOS Alert triggered successfully!", "success");
          } else {
            setSosError(data.message || "Failed to trigger SOS alert.");
            addToast(data.message || "Failed to trigger SOS alert.", "error");
          }
        } catch (err: any) {
          setSosError("Failed to trigger SOS alert.");
          addToast("Failed to trigger SOS alert.", "error");
        } finally {
          setSosLoading(false);
        }
      },
      { timeout: 8000 }
    );
  };

  // 1. Direct Search Handler
  const handleSearchSubmit = async (e?: React.FormEvent, plateToSearch?: string) => {
    if (e) e.preventDefault();
    const query = cleanPlateInput(plateToSearch || searchQuery);
    if (!query) {
      setErrorMsg("Please enter a valid plate number.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/vehicles/search?plate=${encodeURIComponent(query)}`);
      if (res.status === 429) {
        throw new Error("Rate limit exceeded. You can only perform 30 searches per hour.");
      }
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to search vehicle.");
      }
      const data = await res.json();
      setSearchResults(data.data);
      setSearchedPlate(query);
      setUiState("banner");

      // Save to recent searches state and cache in localStorage
      setRecentSearches((prev) => {
        const next = [query, ...prev.filter((p) => p !== query)].slice(0, 4);
        localStorage.setItem("route-recent-searches", JSON.stringify(next));
        return next;
      });

      trackEvent("Plate Searched", {
        success: true,
        found: !!data.data.vehicle,
        transportType: data.data.vehicle?.transportType || "unknown"
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during plate search.");
      trackEvent("Plate Searched", {
        success: false,
        error: err.message || "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Web Speech Recognition API Integration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-NG";

        recognition.onresult = (event: any) => {
          let interim = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript = event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            const clean = cleanPlateInput(finalTranscript);
            setVoiceResult(clean);
            setSearchQuery(clean);
            setUiState("voice_confirm");
          } else {
            setPartialTranscript(interim);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setErrorMsg("Microphone access was denied. Please allow microphone permissions or type manually.");
          } else {
            setErrorMsg("Speech recognition failed. Please try again or type manually.");
          }
          setUiState("search");
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognitionInstance(recognition);
      }
    }
  }, []);

  const startListening = () => {
    if (!recognitionInstance) return;
    setErrorMsg("");
    setVoiceResult("");
    setPartialTranscript("");
    setIsListening(true);
    setUiState("voice");
    try {
      recognitionInstance.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
      setUiState("search");
    }
  };

  const stopListening = () => {
    if (!recognitionInstance) return;
    setIsListening(false);
    setUiState("search");
    try {
      recognitionInstance.stop();
    } catch (e) {
      console.error("Failed to stop speech recognition:", e);
    }
  };

  const handleVoiceConfirmYes = () => {
    setSearchQuery(voiceResult);
    setUiState("description");
  };

  const handleVoiceConfirmEdit = () => {
    setSearchQuery(voiceResult);
    setUiState("search");
    setErrorMsg("Please correct the plate number below.");
  };

  // Proceed to log trip (Carries state to /trip/new)
  const handleProceedToTrip = (plateNum: string) => {
    const params = new URLSearchParams({
      plate: plateNum,
      transportType: transportType,
      color: vehicleColor,
      windows: showWindowsDropdown ? vehicleWindows : "",
      condition: vehicleCondition,
    });
    router.push(`/trip/new?${params.toString()}`);
  };

  // Check if we should render the windows dropdown
  const showWindowsDropdown = 
    transportType === "Uber/Bolt" || transportType === "Taxi";

  const getSafetyBadgeStyle = (indicator?: string) => {
    switch (indicator) {
      case "green": return styles.badgeGreen;
      case "yellow":
      case "orange": return styles.badgeYellow;
      case "red": return styles.badgeRed;
      default: return styles.badgeGreen;
    }
  };

  const getPlateBorderColor = (flagCount?: number) => {
    const count = flagCount ?? 0;
    if (count === 0) return "var(--color-safety-status-safe)";
    if (count === 1 || count === 2) return "var(--color-safety-status-caution)";
    if (count === 3) return "var(--color-safety-status-warning)";
    return "var(--color-safety-status-dangerous)";
  };

  return (
    <main className={styles.container}>
      <PostRideSurvey />
      {/* HEADER SECTION */}
      {uiState === "search" && (
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <img 
              src={user?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} 
              className={styles.avatar} 
              alt="User Avatar" 
            />
            <div className={styles.userInfo}>
              <span className={styles.greetingText}>Hello,</span>
              <h2 className={styles.name}>{dbUser?.displayName || "Commuter"}</h2>
            </div>
          </div>
          <div className={styles.bellContainer}>
            <button 
              className={styles.bellBtn} 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (hasUnread) {
                  markAllRead().catch((e) => console.error("Failed to mark notifications read", e));
                }
              }}
              aria-label="Notifications" 
              title="Notifications"
            >
              <Bell size={20} />
              {hasUnread && <span className={styles.bellBadge}></span>}
            </button>

            {showNotifications && (
              <>
                <div 
                  className={styles.notificationsBackdrop} 
                  onClick={() => setShowNotifications(false)}
                />
                <div className={styles.notificationsPopover}>
                  <div className={styles.notificationsHeader}>
                    <h3>Notifications</h3>
                    <button 
                      type="button" 
                      className={styles.closeNotificationsBtn}
                      onClick={() => setShowNotifications(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className={styles.notificationsList}>
                    {notifications.length === 0 ? (
                      <p className={styles.emptyNotifications}>No notifications yet.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          className={`${styles.notificationItem} ${!notif.isRead ? styles.notificationUnread : ""}`}
                        >
                          <div className={styles.notificationContent}>
                            <strong className={styles.notificationTitle}>{notif.title}</strong>
                            <p className={styles.notificationMessage}>{notif.message}</p>
                            <span className={styles.notificationTime}>
                              {new Date(notif.createdAt).toLocaleDateString("en-NG", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <button 
                            type="button" 
                            className={styles.clearNotifBtn}
                            onClick={() => {
                              clearNotification({ id: notif._id }).catch((e) => console.error(e));
                            }}
                            title="Delete notification"
                            aria-label="Delete notification"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>
      )}

      {/* STATE 1: SEARCH & ACTIONS FORM */}
      {uiState === "search" && (
        <>
          {pinnedVehicles.length > 0 && (
            <section className={styles.pinnedRow}>
              <div className={styles.pinnedRowHeader}>
                <Pin size={12} className={styles.pinnedRowIcon} />
                <span>PINNED VEHICLES</span>
              </div>
              <div className={styles.pinnedChipsList}>
                {pinnedVehicles.map((vehicle) => {
                  const safetyColor = vehicle.safetyIndicator === "green" ? "#10b981" :
                                      vehicle.safetyIndicator === "yellow" ? "#eab308" :
                                      vehicle.safetyIndicator === "orange" ? "#f97316" : "#ef4444";
                  return (
                    <div 
                      key={vehicle._id} 
                      className={styles.pinnedChip}
                      onClick={(e) => {
                        setSearchQuery(vehicle.plate);
                        handleSearchSubmit(e, vehicle.plate);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <span 
                        className={styles.pinnedChipStatusDot} 
                        style={{ backgroundColor: safetyColor }}
                      />
                      <strong className={styles.pinnedChipPlate}>{vehicle.plate}</strong>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {/* ACTIVE TRIP OR STATS WATCHLIST CARD (Mockup Stepper Equivalent) */}
          <section className={styles.statusPanel}>
            {activeTrip ? (
              // Case A: Active/Pending Trip Stepper
              <>
                <div className={styles.statusHeader}>
                  <div>
                    <p className={styles.sectionKicker}>Current Transit</p>
                    <h2>Active Trip: {activeTrip.plate}</h2>
                  </div>
                  <span className={styles.modePill} style={{ backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563eb", borderColor: "rgba(37, 99, 235, 0.15)" }}>
                    {activeTrip.status === "active" ? "In Transit" : "Review Needed"}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "4px 0" }}>
                  <span>From: <strong>{activeTrip.boardingLocation}</strong></span>
                </div>
                
                {/* Visual timeline stepper */}
                <div className={styles.stepperContainer}>
                  <div className={styles.stepperTrackWrapper}>
                    <div className={styles.stepperLine}></div>
                    <div 
                      className={styles.stepperLineProgress} 
                      style={{ 
                        width: activeTrip.status === "incident-triggered" ? "100%" : 
                               activeTrip.status === "pending-review" ? "50%" : "25%" 
                      }}
                    ></div>
                  </div>
                  <div className={styles.stepperDotsRow}>
                    <div className={`${styles.stepperStep} ${styles.active}`}>
                      <div className={`${styles.stepperDot} ${styles.checked}`}></div>
                      <span className={styles.stepperLabel}>Boarded</span>
                    </div>
                    <div className={`${styles.stepperStep} ${activeTrip.status !== "active" ? styles.active : ""}`}>
                      <div className={`${styles.stepperDot} ${activeTrip.status !== "active" ? styles.checked : styles.active}`}></div>
                      <span className={styles.stepperLabel}>Midpoint</span>
                    </div>
                    <div className={`${styles.stepperStep} ${activeTrip.status === "incident-triggered" ? styles.active : ""}`}>
                      <div className={`${styles.stepperDot} ${activeTrip.status === "incident-triggered" ? styles.checked : ""}`}></div>
                      <span className={styles.stepperLabel}>Arrived</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Case B: Idle Watchlist Stats Stepper
              <>
                <div className={styles.statusHeader}>
                  <div>
                    <p className={styles.sectionKicker}>Today</p>
                    <h2>Your Route Watch</h2>
                  </div>
                </div>

                {isHomeLoading ? (
                  <div className={styles.statGrid}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="rectangular" width="100%" height={72} style={{ borderRadius: "16px" }} />
                    ))}
                  </div>
                ) : (
                  <div className={styles.statGrid}>
                    <div className={styles.statTile}>
                      <span>{savedCount}</span>
                      <p>Saved</p>
                    </div>
                    <div className={styles.statTile}>
                      <span>{pinnedCount}</span>
                      <p>Pinned</p>
                    </div>
                    <div className={styles.statTile}>
                      <span>{feedCount}</span>
                      <p>Alerts</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* BARE SEARCH BAR GROUP */}
          <div className={styles.searchContainer}>
            <form onSubmit={(e) => handleSearchSubmit(e)} className={styles.searchSection}>
              <div className={styles.searchRow}>
                <div className={styles.searchInputWrapper}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Enter plate e.g. BDG 123 - AA"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(cleanPlateInput(e.target.value))}
                    disabled={loading}
                    inputMode="text"
                    autoComplete="off"
                    aria-label="Plate number"
                  />
                </div>

                {/* Voice / submit button — outside the bar */}
                {loading ? (
                  <div className={styles.searchCameraBtn} aria-hidden>
                    <Loader2 className={styles.spin} size={18} />
                  </div>
                ) : searchQuery.trim() ? (
                  <button
                    type="submit"
                    className={styles.searchCameraBtn}
                    aria-label="Search plate"
                  >
                    <ArrowRight size={18} />
                  </button>
                ) : speechSupported ? (
                  <button
                    type="button"
                    className={`${styles.searchCameraBtn} ${isListening ? styles.listeningBtn : ""}`}
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? "Stop listening" : "Speak plate number"}
                    title={isListening ? "Listening... click to stop" : "Speak plate number"}
                  >
                    <Mic size={18} />
                  </button>
                ) : null}
              </div>
            </form>

            {/* SEARCH HELPER CAPTION */}
            <p className={styles.searchHelperText}>
              Verify any Danfo, ride-share, or commercial vehicle before boarding.
            </p>
          </div>

          {/* RECENT SEARCHES CHIPS */}
          {recentSearches.length > 0 && (
            <div className={styles.recentSearchesWrapper}>
              <div className={styles.recentSearchesHeader}>
                <h3 className={styles.recentSearchesTitle}>Recent Search</h3>
                <button
                  type="button"
                  className={styles.clearRecentBtn}
                  onClick={clearRecentSearches}
                >
                  Clear all
                </button>
              </div>
              <div className={styles.recentSearchesGrid}>
                {recentSearches.map((plate) => (
                  <div key={plate} className={styles.recentSearchChip}>
                    <span
                      className={styles.recentSearchText}
                      onClick={() => {
                        setSearchQuery(plate);
                        handleSearchSubmit(undefined, plate);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {plate}
                    </span>
                    <button
                      type="button"
                      className={styles.removeSearchChipBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(plate);
                      }}
                      aria-label={`Remove search for ${plate}`}
                      title={`Remove search for ${plate}`}
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}




          {errorMsg && (
            <div className={styles.errorMessage}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
              <button 
                type="button" 
                className={styles.errorCloseBtn} 
                onClick={() => setErrorMsg("")}
                aria-label="Dismiss error"
                title="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {showEmptyHome && recentTrips.length > 0 && (
            <section className={styles.recentChecksSection}>
              <div className={styles.recentHeader}>
                <h2>My Trips</h2>
                <button
                  type="button"
                  className={styles.viewAllBtn}
                  onClick={() => router.push("/trip")}
                >
                  View all <ArrowRight size={13} />
                </button>
              </div>
              <div className={styles.recentTripsList}>
                {recentTrips.map((trip) => {
                  const statusColor =
                    trip.status === "safe" || trip.status === "resolved" ? "#10b981" :
                    trip.status === "incident-triggered" ? "#ef4444" :
                    trip.status === "pending-review" ? "#eab308" : "#a3a3a3";
                  const statusLabel =
                    trip.status === "safe" ? "Safe" :
                    trip.status === "resolved" ? "Resolved" :
                    trip.status === "incident-triggered" ? "Incident" :
                    trip.status === "pending-review" ? "Review" : trip.status;
                  const dateStr = new Date(trip.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short"
                  });
                  return (
                    <div
                      key={trip._id}
                      className={styles.recentTripItem}
                      onClick={() => router.push(`/trip/${trip._id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.recentTripLeft}>
                        <strong className={styles.recentPlate}>{trip.plate}</strong>
                        <span className={styles.recentTripLocation}>{trip.boardingLocation}</span>
                      </div>
                      <div className={styles.recentTripRight}>
                        <span className={styles.recentTripStatus} style={{ color: statusColor }}>
                          {statusLabel}
                        </span>
                        <span className={styles.recentTripDate}>{dateStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* COMMUTE SAFETY GUIDE CAROUSEL */}
          <section className={styles.carouselSection}>
            <div className={styles.carouselHeader}>
              <div>
                <p className={styles.sectionKicker}>Safety Checklist</p>
                <h2>Commute Guides</h2>
              </div>
            </div>
            <div className={styles.carouselContainer}>
              <div className={styles.carouselTrack}>
                {commuteGuides.map((guide) => {
                  const isExpanded = expandedGuideTitle === guide.title;
                  return (
                    <div 
                      key={guide.title} 
                      className={`${styles.notebookCard} ${styles[guide.colorClass as keyof typeof styles] || ""} ${isExpanded ? styles.notebookCardExpanded : ""}`}
                    >
                      <div className={styles.notebookHoles}>
                        {[1, 2, 3, 4, 5].map((h) => (
                          <div key={h} className={styles.notebookHole} />
                        ))}
                      </div>
                      <div className={styles.notebookLines}>
                        {[1, 2, 3, 4, 5, 6, ...(isExpanded ? [7, 8, 9, 10] : [])].map((l) => (
                          <div key={l} className={styles.notebookLine} />
                        ))}
                      </div>
                      <div className={styles.paperclip} />
                      <div className={styles.illustrationFrame}>
                        <img src={guide.illustration} alt={guide.title} className={styles.illustrationImage} />
                      </div>
                      <h3 className={styles.notebookCardTitle}>{guide.title}</h3>
                      <p className={styles.notebookCardText}>
                        {guide.summary}{" "}
                        {isExpanded && <span>{guide.detail}{" "}</span>}
                        <span 
                          role="button"
                          tabIndex={0}
                          className={styles.readMoreLink}
                          onClick={() => setExpandedGuideTitle(isExpanded ? null : guide.title)}
                          onKeyDown={(e) => { if (e.key === "Enter") setExpandedGuideTitle(isExpanded ? null : guide.title); }}
                        >
                          {isExpanded ? "less" : "read more"}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* LIVE SAFETY FEED SECTION */}
          <section id="feed-section" className={`${styles.feedSection} ${showEmptyHome ? styles.feedSectionCompact : ""}`}>
            <div className={styles.feedTitle}>
              <div>
                <p className={styles.sectionKicker}>Community signal</p>
                <span>Live Safety Feed</span>
              </div>
            </div>

            {feedList === undefined ? (
              <div className={styles.feedGrid}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.feedCard} style={{ opacity: 0.7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <Skeleton variant="rectangular" width={110} height={40} />
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Skeleton variant="circular" width={28} height={28} />
                        <Skeleton variant="circular" width={28} height={28} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                      <Skeleton variant="rectangular" width={90} height={24} />
                      <Skeleton variant="rectangular" width={70} height={24} />
                    </div>
                    <Skeleton variant="text" width="100%" height={16} style={{ marginBottom: "8px" }} />
                    <Skeleton variant="text" width="60%" height={16} />
                  </div>
                ))}
              </div>
            ) : feedList.length === 0 ? (
              <div className={styles.emptyFeedCard}>
                <CheckCircle className={styles.emptyFeedIcon} size={24} />
                <div>
                  <strong>All clear for now</strong>
                  <p>No high-risk commercial vehicles have entered your feed recently.</p>
                </div>
              </div>
            ) : (
              <div className={styles.feedGrid}>
                {feedList.map((item) => {
                  return (
                    <div key={item._id} className={styles.feedCard}>
                      <div className={styles.feedCardHeader}>
                        <div className={styles.plateContainer} style={{ borderColor: getPlateBorderColor(item.flagCount) }}>
                          <span className={styles.plateLagosText}>Lagos</span>
                          <span className={styles.plateNumber}>{item.plate}</span>
                        </div>
                        
                        <div className={styles.controls}>
                          <button
                            className={`${styles.actionButton} ${item.isPinned ? styles.pinButtonActive : ""}`}
                            onClick={() => handlePinToggle(item.plate)}
                            disabled={!item.isSaved}
                            title={!item.isSaved ? "Bookmark vehicle first to pin" : item.isPinned ? "Unpin vehicle" : "Pin vehicle"}
                            style={{ opacity: !item.isSaved ? 0.5 : 1 }}
                          >
                            <Pin size={15} style={{ fill: item.isPinned ? "currentColor" : "none" }} />
                          </button>
                          <button
                            className={`${styles.actionButton} ${item.isSaved ? styles.active : ""}`}
                            onClick={() => handleSaveToggle(item.plate, item.isSaved)}
                            title={item.isSaved ? "Remove from bookmarks" : "Bookmark vehicle"}
                          >
                            <Bookmark size={15} style={{ fill: item.isSaved ? "currentColor" : "none" }} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.feedCardBody}>
                        <div className={styles.metaRow}>
                          <span 
                            className={`${styles.safetyBadge} ${
                              item.dangerousStatus || item.safetyIndicator === "red"
                                ? styles["feedBadge-red"]
                                : item.safetyIndicator === "green"
                                ? styles["feedBadge-green"]
                                : styles["feedBadge-yellow"]
                            }`}
                          >
                            <span className={styles.dot} />
                            {item.dangerousStatus || item.safetyIndicator === "red"
                              ? "Dangerous"
                              : item.safetyIndicator === "green"
                              ? "Safe"
                              : "Be Careful"}
                          </span>
                          {item.transportType && (
                            <span className={styles.infoBadge}>{item.transportType}</span>
                          )}
                        </div>
                        {item.safetyIndicator !== "green" && (
                          <div style={{ fontSize: "13.5px", fontWeight: 700, marginTop: 4, color: "var(--color-text-primary)" }}>
                            Primary Concern: <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>{item.primaryOffense}</span>
                          </div>
                        )}
                        <p className={styles.feedDescription}>
                          {item.description}
                        </p>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: 2 }}>
                          🚨 Flagged by <strong>{item.uniqueFlaggersCount}</strong> unique commuter{item.uniqueFlaggersCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* LAGOS EMERGENCY QUICK DIAL SECTION */}
          <section className={styles.emergencyDialSection}>
            <div className={styles.emergencyHeader}>
              <div className={styles.emergencyTitleRow}>
                <AlertTriangle className={styles.emergencyIcon} size={22} />
                <h2>Lagos Emergency Dial</h2>
              </div>
              <p className={styles.emergencySub}>Quick access to state emergency channels and safety net.</p>
            </div>
            
            <div className={styles.emergencyActionsGrid}>
              <a href="tel:112" className={styles.emergencyDialBtn} onClick={() => trackEvent("Emergency Call Initiated", { channel: "112" })}>
                Call 112 (LSEMA)
              </a>
              <a href="tel:767" className={styles.emergencyDialBtn} onClick={() => trackEvent("Emergency Call Initiated", { channel: "767" })}>
                Call 767 (Hotline)
              </a>
              <button 
                type="button" 
                className={styles.emergencySosBtn}
                onClick={handleTriggerQuickSOS}
                disabled={sosLoading}
              >
                {sosLoading ? "Triggering..." : "Send Silent SOS"}
              </button>
            </div>

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
          </section>
        </>
      )}



      {/* SEARCH HEADER AREA FOR BANNER AND RESULTS STATES */}
      {(uiState === "banner" || uiState === "results") && (
        <div className={styles.searchPageContainer}>
          {/* Back Button Row */}
          <div className={styles.searchPageBackRow}>
            <button
              type="button"
              className="backBtn"
              onClick={() => {
                setUiState("search");
                setSearchResults(null);
                setSearchQuery("");
                setShowMenu(false);
                setShowResultsMenu(false);
              }}
              aria-label="Back to home"
              title="Back"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Search Input Bar below Back Button */}
          <div className={styles.searchContainer} style={{ marginTop: "12px", marginBottom: "16px" }}>
            <form onSubmit={(e) => handleSearchSubmit(e)} className={styles.searchSection}>
              <div className={styles.searchRow}>
                <div className={styles.searchInputWrapper}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Enter plate e.g. BDG 123 - AA"
                    value={searchQuery}
                    onChange={(e) => {
                      const newVal = cleanPlateInput(e.target.value);
                      setSearchQuery(newVal);
                      // Make card disappear only when search input has been completely cleared
                      if (newVal.trim() === "") {
                        setSearchResults(null);
                      }
                    }}
                    disabled={loading}
                    inputMode="text"
                    autoComplete="off"
                    aria-label="Plate number"
                  />
                </div>

                {loading ? (
                  <div className={styles.searchCameraBtn} aria-hidden>
                    <Loader2 className={styles.spin} size={18} />
                  </div>
                ) : searchQuery.trim() ? (
                  <button
                    type="submit"
                    className={styles.searchCameraBtn}
                    aria-label="Search plate"
                  >
                    <ArrowRight size={18} />
                  </button>
                ) : speechSupported ? (
                  <button
                    type="button"
                    className={`${styles.searchCameraBtn} ${isListening ? styles.listeningBtn : ""}`}
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? "Stop listening" : "Speak plate number"}
                    title={isListening ? "Listening... click to stop" : "Speak plate number"}
                  >
                    <Mic size={18} />
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANNER STATE: slide-down result summary */}
      {uiState === "banner" && searchResults && (() => {
        const vehicle = searchResults.vehicle;
        const flagCount = vehicle?.flagCount ?? 0;
        const isDangerous = vehicle?.dangerousStatus || vehicle?.safetyIndicator === "red" || vehicle?.safetyIndicator === "orange";
        const hasReports = !!vehicle && flagCount > 0;
        const isVigilant = hasReports && !isDangerous && flagCount < 3;
        const isClickable = hasReports; // only flagged vehicles can tap for full details

        return (
          <div className={styles.resultBanner}>
            {/* Plate row + 3-dot menu — always shown */}
            <div className={styles.resultBannerHeader}>
              <div className={styles.resultBannerPlateRow}>
                <div 
                  className={styles.plateContainer}
                  style={{ borderColor: getPlateBorderColor(flagCount) }}
                >
                  <span className={styles.plateLagosText}>Lagos</span>
                  <span className={styles.plateNumber}>{searchedPlate}</span>
                </div>

                {/* 3-dot menu */}
                <div className={styles.resultBannerActionsContainer}>
                  <button
                    type="button"
                    className={styles.resultBannerMoreBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    title="More actions"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {showMenu && (
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          handleSaveToggle(searchedPlate, !!isSearchedSaved);
                          setShowMenu(false);
                        }}
                      >
                        {isSearchedSaved ? "Unbookmark" : "Bookmark"}
                      </button>
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          handlePinToggle(searchedPlate);
                          setShowMenu(false);
                        }}
                      >
                        {isSearchedPinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => openFlagModal(searchedPlate)}
                      >
                        Flag
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Badge: only for flagged vehicles */}
              {hasReports && (
                <div
                  className={`${styles.resultBannerStatusBadge} ${
                    isDangerous ? styles.badgeRed : styles.badgeYellow
                  }`}
                >
                  <AlertTriangle size={13} />
                  <span>
                    {isDangerous ? "Flagged – Dangerous" : `Flagged – Be Careful`}
                  </span>
                </div>
              )}
            </div>

            {/* Body — clickable only if vehicle has reports */}
            {isClickable ? (
              <div
                className={styles.resultBannerInner}
                onClick={() => setUiState("results")}
                role="button"
                tabIndex={0}
              >
                {/* Vigilant warning (1–2 reports, not yet dangerous) */}
                {isVigilant && (
                  <p className={styles.resultBannerVigilant}>
                    ⚠️ This vehicle has {flagCount} flag report{flagCount > 1 ? "s" : ""} from other commuters. Stay alert.
                  </p>
                )}
                <p className={styles.resultBannerHint}>Tap to see full details</p>
              </div>
            ) : (
              /* No flag reports — not clickable, just a memo */
              <p className={styles.resultBannerNoReport}>
                No flag reports for this vehicle yet.
              </p>
            )}

            {/* Log Trip CTA */}
            <div className={styles.resultBannerActionsSingle}>
              <button
                type="button"
                className={styles.resultBannerLogTripSingle}
                onClick={() => router.push(`/trip/new?plate=${encodeURIComponent(searchedPlate)}`)}
                disabled={hasFewerThanTwoContacts}
                title={hasFewerThanTwoContacts ? "Add 2 contacts to log a trip" : "Log a trip with this vehicle"}
              >
                Log Trip <ArrowRight size={15} />
              </button>
            </div>
          </div>
        );
      })()}


      {/* STATE 2: VOICE LISTENING VIEWPORT */}
      {uiState === "voice" && (
        <div className={styles.voiceContainer}>
          <div className={styles.voiceWaveWrapper}>
            <div className={styles.voicePulseCircle} />
            <div className={styles.voicePulseCircleDelay1} />
            <div className={styles.voicePulseCircleDelay2} />
            <Mic size={48} className={styles.voiceMicIcon} />
          </div>
          <h3 className={styles.voiceListeningTitle}>Listening for Plate...</h3>
          <p className={styles.voiceListeningSubtitle}>Speak clearly e.g. "KJA 4-8-2 Q-R"</p>
          {partialTranscript && (
            <div className={styles.voicePartial}>"{partialTranscript}"</div>
          )}
          <button className={styles.stopVoiceBtn} onClick={stopListening}>
            Cancel
          </button>
        </div>
      )}

      {/* STATE 3: VOICE TRANSCRIPTION CONFIRMATION */}
      {uiState === "voice_confirm" && (
        <div className={styles.voiceConfirmCard}>
          <h3>Confirm Spoken Plate</h3>
          <p className={styles.voicePrompt}>Is this plate correct?</p>
          <div className={styles.voicePlateResult}>{voiceResult}</div>
          <div className={styles.voiceConfirmActions}>
            <button className="primary" onClick={handleVoiceConfirmYes}>
              <CheckCircle size={18} /> Yes, correct
            </button>
            <button className="secondary" onClick={handleVoiceConfirmEdit}>
              <X size={18} /> No, edit
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: VEHICLE DESCRIPTIONS FORM (AFTER OCR CONFIRMED) */}
      {uiState === "description" && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3>Vehicle Details</h3>
            <p>Add optional identifiers to help locate the vehicle if needed.</p>
          </div>

          <div className={styles.formBody}>
            <div className={styles.fieldItem}>
              <label>Transport Type</label>
              <select 
                value={transportType} 
                onChange={(e) => setTransportType(e.target.value)}
              >
                <option value="Uber/Bolt">Uber/Bolt</option>
                <option value="Taxi">Taxi (Personal)</option>
                <option value="Danfo">Danfo</option>
                <option value="Keke">Keke</option>
                <option value="Okada">Okada (Bike)</option>
                <option value="Shuttle">Shuttle</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={styles.fieldItem}>
              <label>Vehicle Colour (Optional)</label>
              <select 
                value={vehicleColor} 
                onChange={(e) => setVehicleColor(e.target.value)}
              >
                <option value="">Choose a colour...</option>
                <option value="Yellow">Yellow (Lagos standard)</option>
                <option value="White">White</option>
                <option value="Black">Black</option>
                <option value="Red">Red</option>
                <option value="Blue">Blue</option>
                <option value="Silver">Silver</option>
                <option value="Brown">Brown</option>
                <option value="Green">Green</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {showWindowsDropdown && (
              <div className={styles.fieldItem}>
                <label>Windows (Optional)</label>
                <select 
                  value={vehicleWindows} 
                  onChange={(e) => setVehicleWindows(e.target.value)}
                >
                  <option value="">Choose window type...</option>
                  <option value="Tinted">Tinted</option>
                  <option value="Not tinted">Not tinted</option>
                </select>
              </div>
            )}

            <div className={styles.fieldItem}>
              <label>Vehicle Condition (Optional)</label>
              <select 
                value={vehicleCondition} 
                onChange={(e) => setVehicleCondition(e.target.value)}
              >
                <option value="">Choose vehicle condition...</option>
                <option value="Clean">Clean</option>
                <option value="Damaged or dented">Damaged or dented</option>
              </select>
            </div>
          </div>

          {hasFewerThanTwoContacts && (
            <div className={styles.disabledWarningBanner}>
              <AlertCircle size={16} />
              <span>Add new contact to log trip.</span>
            </div>
          )}

          <div className={styles.ocrActions}>
            <button
              className="primary"
              onClick={() => handleProceedToTrip(searchQuery)}
              disabled={hasFewerThanTwoContacts}
            >
              Proceed to Trip <ArrowRight size={18} />
            </button>
            <button className="secondary" onClick={() => setUiState("search")}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* STATE 5: VEHICLE SEARCH RESULTS */}
      {uiState === "results" && searchResults && (
        <div className={styles.resultsCard}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsHeaderLeft}>
              <span className={styles.resultsLabel}>Vehicle Query</span>
              <div className={styles.resultsPlateRow}>
                <div 
                  className={styles.plateContainer}
                  style={{ borderColor: getPlateBorderColor(searchResults.vehicle?.flagCount ?? 0) }}
                >
                  <span className={styles.plateLagosText}>Lagos</span>
                  <span className={styles.plateNumber}>{searchedPlate}</span>
                </div>
                
                <div className={styles.resultsHeaderActions}>
                  <button
                    type="button"
                    className={styles.resultsMoreBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResultsMenu(!showResultsMenu);
                    }}
                    title="More actions"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {/* Floating Dropdown Menu */}
                  {showResultsMenu && (
                    <div className={styles.resultsDropdownMenu} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.resultsDropdownItem}
                        onClick={() => {
                          handleSaveToggle(searchedPlate, !!isSearchedSaved);
                          setShowResultsMenu(false);
                        }}
                      >
                        {isSearchedSaved ? "Unbookmark" : "Bookmark"}
                      </button>
                      <button
                        type="button"
                        className={styles.resultsDropdownItem}
                        onClick={() => {
                          handlePinToggle(searchedPlate);
                          setShowResultsMenu(false);
                        }}
                      >
                        {isSearchedPinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        type="button"
                        className={styles.resultsDropdownItem}
                        onClick={() => openFlagModal(searchedPlate)}
                      >
                        Flag
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Badge only shown when vehicle has flag reports */}
              {searchResults.vehicle && (
                <div
                  className={`${styles.resultsStatusBadge} ${
                    searchResults.vehicle.dangerousStatus || searchResults.vehicle.safetyIndicator === "red"
                      ? styles.badgeRed
                      : styles.badgeYellow
                  }`}
                >
                  <AlertTriangle size={13} />
                  <span>
                    {searchResults.vehicle.dangerousStatus || searchResults.vehicle.safetyIndicator === "red"
                      ? "Flagged – Dangerous"
                      : "Flagged – Be Careful"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* If Vehicle Exists */}
          {searchResults.vehicle ? (
            <div className={styles.vehicleDetails}>
              <div className={styles.metricRow}>
                <div className={styles.metricItem}>
                  <span className={styles.metricNum}>{searchResults.vehicle.flagCount}</span>
                  <span className={styles.metricLabel}>Community Flags</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricVal}>{searchResults.vehicle.transportType}</span>
                  <span className={styles.metricLabel}>Transport Type</span>
                </div>
              </div>

              {searchResults.vehicle.dangerousStatus && (
                <div className={styles.dangerBanner}>
                  <AlertTriangle size={20} />
                  <div>
                    <h4>Dangerous Vehicle Alert</h4>
                    <p>This vehicle has been escalated due to multiple safety concerns.</p>
                  </div>
                </div>
              )}

              <div className={styles.detailsGroup}>
                <h4>Vehicle Description</h4>
                <p>{searchResults.vehicle.description || "No description logged by previous users."}</p>
              </div>

              <div className={styles.incidentsList}>
                <h4>Flag Reports ({searchResults.incidents.length})</h4>
                {searchResults.incidents.length === 0 ? (
                  <p className={styles.noIncidents}>No flag reports submitted for this vehicle yet.</p>
                ) : (
                  <div className={styles.incidentItems}>
                    {searchResults.incidents.map((inc) => (
                      <div key={inc._id} className={styles.incidentItem}>
                        <div className={styles.incHeader}>
                          <span className={styles.incType}>{inc.incidentType}</span>
                          <span className={styles.incDate}>
                            {new Date(inc.createdAt).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </span>
                        </div>
                        {inc.vehicleType && (
                          <span className={styles.incDetail}>
                            <strong>Vehicle:</strong> {inc.vehicleType}
                          </span>
                        )}
                        {inc.location && (
                          <span className={styles.incDetail}>
                            <strong>Reported at:</strong> {inc.location}
                          </span>
                        )}
                        {inc.time && (
                          <span className={styles.incDetail}>
                            <strong>Time:</strong> {inc.time}
                          </span>
                        )}
                        {inc.description && (
                          <p className={styles.incDescription}>{inc.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vehicle has no record — neutral language, no branding as Safe */
            <div className={styles.cleanRecord}>
              <CheckCircle size={40} className={styles.safeIcon} />
              <h3>No Flag Reports</h3>
              <p>This vehicle has no flag reports from other Route commuters. You can log your trip below.</p>
            </div>
          )}

          {hasFewerThanTwoContacts && (
            <div className={styles.disabledWarningBanner}>
              <AlertCircle size={16} />
              <span>Add new contact to log trip.</span>
            </div>
          )}

          {/* Stacked CTAs */}
          <div className={styles.resultsActionsStacked}>
            <button
              className={styles.primaryBtnStacked}
              onClick={() => handleProceedToTrip(searchedPlate)}
              disabled={hasFewerThanTwoContacts}
            >
              Log a Trip
            </button>
            <button 
              className={styles.secondaryBtnStacked} 
              onClick={() => { setSearchQuery(""); setUiState("search"); }}
            >
              Return Home
            </button>
          </div>
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
              <div className={styles.reportDisclaimer}>
                <ShieldAlert className={styles.disclaimerIcon} size={20} />
                <div className={styles.disclaimerContent}>
                  <h4>Report Quality Guard</h4>
                  <p>
                    To maintain community trust, reporting is strictly limited per month. Please report sincerely based on actual safety events. Fabricating reports, targeting vehicles out of personal grudge, spite, or reporting as a joke is a violation of Route policy and will result in the immediate and permanent revocation of your reporting privileges.
                  </p>
                </div>
              </div>

              {/* Vehicle Type */}
              <div className={styles.flagField}>
                <label className={styles.flagLabel}>Vehicle Type *</label>
                <select
                  className={styles.flagSelect}
                  value={flagVehicleType}
                  onChange={(e) => setFlagVehicleType(e.target.value)}
                >
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

              {/* Location */}
              <div className={styles.flagField}>
                <label className={styles.flagLabel}>Where did this happen? *</label>
                <input
                  type="text"
                  className={styles.flagInput}
                  placeholder="e.g. Oshodi Under Bridge, Lagos"
                  value={flagLocation}
                  onChange={(e) => setFlagLocation(e.target.value.slice(0, 150))}
                />
              </div>

              {/* Time */}
              <div className={styles.flagField}>
                <label className={styles.flagLabel}>When did this happen? *</label>
                <input
                  type="text"
                  className={styles.flagInput}
                  placeholder="e.g. Monday 3pm, or Yesterday evening"
                  value={flagTime}
                  onChange={(e) => setFlagTime(e.target.value.slice(0, 50))}
                />
              </div>

              {/* Offence Type */}
              <div className={styles.flagField}>
                <label className={styles.flagLabel}>Type of incident *</label>
                <select
                  className={styles.flagSelect}
                  value={flagIncidentType}
                  onChange={(e) => setFlagIncidentType(e.target.value)}
                >
                  <option value="">Select incident type...</option>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Custom incident if Other selected */}
              {flagIncidentType === "Other (describe below)" && (
                <div className={styles.flagField}>
                  <label className={styles.flagLabel}>Describe the incident type</label>
                  <input
                    type="text"
                    className={styles.flagInput}
                    placeholder="Brief label for the incident"
                    value={flagCustomIncident}
                    onChange={(e) => setFlagCustomIncident(e.target.value.slice(0, 100))}
                  />
                </div>
              )}

              {/* Description */}
              <div className={styles.flagField}>
                <label className={styles.flagLabel}>What happened? (optional)</label>
                <textarea
                  className={styles.flagTextarea}
                  placeholder="Describe what happened in detail so other commuters are aware..."
                  rows={4}
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value.slice(0, 500))}
                />
                <span className={styles.flagCharCount}>{flagDescription.length}/500</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.flagSubmitBtn}
              onClick={handleFlagSubmit}
              disabled={flagSubmitting}
            >
              {flagSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      )}



      {/* Toast Notifications System */}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${
              toast.type === "success" ? styles.toastSuccess : styles.toastError
            }`}
          >
            <div className={styles.toastIcon}>
              {toast.type === "success" ? (
                <CheckCircle size={18} style={{ color: "#10b981" }} />
              ) : (
                <AlertCircle size={18} style={{ color: "#ef4444" }} />
              )}
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
