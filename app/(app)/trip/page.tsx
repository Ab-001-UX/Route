"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Plus, 
  Calendar, 
  MapPin, 
  Car, 
  AlertCircle, 
  Search, 
  Filter, 
  Clock, 
  Grid, 
  CalendarDays, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  SlidersHorizontal 
} from "lucide-react";
import styles from "./trip.module.css";
import Skeleton from "@/components/ui/Skeleton";
import { useSettings } from "@/components/providers/ThemeProvider";

const EmptyStateIllustration = () => (
  <div className={styles.illustrationContainer}>
    <div className={styles.abstractBlob} />
    <div className={styles.iconWrapper}>
      <BookOpen size={32} className={styles.bookIcon} />
    </div>
  </div>
);

export default function TripsPage() {
  const router = useRouter();
  const { privacyMode } = useSettings();

  // State hooks
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [layoutType, setLayoutType] = useState<"card" | "timeline">("card");
  
  // Selected date for both Block (card) and Timeframe (timeline) layouts
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Active month being viewed in the calendar filter dropdown
  const [viewingMonth, setViewingMonth] = useState<Date>(() => {
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [clickedHour, setClickedHour] = useState<number | null>(null);
  const [showEarlyHours, setShowEarlyHours] = useState(false);

  // Fetch Trips
  const trips = useQuery(api.trips.getTrips);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const maskPlate = (plate: string) => {
    if (!plate) return "";
    return plate.length > 3 ? `${plate.substring(0, 3)}-***` : "HIDDEN";
  };

  // Helper to get start of today for defaults/resets
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Apply search query and selected date filter
  let filteredTrips = trips || [];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredTrips = filteredTrips.filter(
      (t) =>
        (t.plate && t.plate.toLowerCase().includes(q)) ||
        (t.transportType && t.transportType.toLowerCase().includes(q))
    );
  }

  // Filter trips strictly on the selected calendar date
  filteredTrips = filteredTrips.filter((t) => {
    const tripDate = new Date(t.createdAt);
    return (
      tripDate.getDate() === selectedDate.getDate() &&
      tripDate.getMonth() === selectedDate.getMonth() &&
      tripDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Calendar days grid generation logic
  const generateCalendarDays = () => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // 1. Fill previous month's trailing cells (greyed out)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      days.push({ date, isCurrentMonth: false });
    }

    // 2. Fill current month's cells
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day, 0, 0, 0, 0);
      days.push({ date, isCurrentMonth: true });
    }

    // 3. Fill next month's leading cells to complete the grid layout
    const totalGridSize = days.length <= 35 ? 35 : 42;
    const nextMonthFillerCount = totalGridSize - days.length;
    for (let day = 1; day <= nextMonthFillerCount; day++) {
      const date = new Date(year, month + 1, day, 0, 0, 0, 0);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  const handlePrevMonth = () => {
    setViewingMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setViewingMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const formatTimelineHeaderDay = (date: Date) => {
    return date.toLocaleDateString([], { weekday: "long" });
  };
  
  const formatTimelineHeaderSub = (date: Date) => {
    return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  };

  const formatClickedHourMsg = (hourNum: number, dateObj: Date) => {
    const ampm = hourNum >= 12 ? "pm" : "am";
    const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    const timeStr = `${displayHour}${ampm}`;
    
    const weekday = dateObj.toLocaleDateString([], { weekday: "long" }).toLowerCase();
    const month = dateObj.toLocaleDateString([], { month: "long" }).toLowerCase();
    
    const day = dateObj.getDate();
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";
    const dayStr = `${day}${suffix}`;
    
    const year = dateObj.getFullYear();
    
    return `You did not have any trip logged at ${timeStr} ${weekday} ${dayStr} ${month} ${year}.`;
  };

  const formatHourLabel = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display} ${period}`;
  };

  // Generate 24 hours timeline range (or 5h to 23h if early hours collapsed)
  const hoursRange: number[] = [];
  const startHour = showEarlyHours ? 0 : 5;
  for (let h = startHour; h <= 23; h++) {
    hoursRange.push(h);
  }

  // Get current time offset in pixels relative to the timeline grid (64px row height)
  const currentTimeLineOffset = (() => {
    if (typeof window === "undefined") return null;
    const today = new Date();
    const isToday = today.getDate() === selectedDate.getDate() &&
                    today.getMonth() === selectedDate.getMonth() &&
                    today.getFullYear() === selectedDate.getFullYear();
    if (!isToday) return null;

    const currentHour = today.getHours();
    const currentMinutes = today.getMinutes();
    
    if (currentHour >= startHour && currentHour <= 23) {
      const rowHeight = 64; // height of each row in pixels
      const rowIndex = currentHour - startHour;
      return rowIndex * rowHeight + (currentMinutes / 60) * rowHeight;
    }
    return null;
  })();

  if (trips === undefined) {
    return (
      <main className={styles.container}>
        <header className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <button className="backBtn" onClick={() => router.push("/home")} aria-label="Go back to home">
              <ChevronLeft size={20} />
            </button>
            <h1 className={styles.title}>My Trips</h1>
            <div className={styles.backBtnSpacer} />
          </div>
        </header>
        <section className={styles.tripList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.tripCard} style={{ opacity: 0.7 }}>
              <div className={styles.tripCardHeader} style={{ marginBottom: "12px" }}>
                <Skeleton variant="rectangular" width={90} height={24} />
                <Skeleton variant="rectangular" width={60} height={20} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Skeleton variant="text" width="50%" height={14} />
                <Skeleton variant="text" width="40%" height={14} />
              </div>
            </div>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <button className="backBtn" onClick={() => router.push("/home")} aria-label="Go back to home">
            <ChevronLeft size={20} />
          </button>
          <h1 className={styles.title}>My Trips</h1>
          <div className={styles.backBtnSpacer} />
        </div>
      </header>

      {/* SEARCH + FILTER ROW */}
      <header className={styles.header}>
        {/* Search Input Container Form */}
        <form className={styles.searchContainer} onSubmit={(e) => e.preventDefault()}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search plate or vehicle type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            enterKeyHint="search"
          />
        </form>

        {/* Filter Trigger Button */}
        <div className={styles.filterWrapper}>
          <button 
            className={styles.filterIconBtn} 
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            aria-label="Filter calendar and layout"
            title="Filters and Layout options"
          >
            <SlidersHorizontal size={20} />
          </button>

          {isFilterDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.calendarHeader}>
                <button type="button" onClick={handlePrevMonth} className={styles.monthNavBtn}>
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.monthTitle}>
                  {viewingMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button type="button" onClick={handleNextMonth} className={styles.monthNavBtn}>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className={styles.calendarWeekdays}>
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className={styles.calendarGrid}>
                {generateCalendarDays().map(({ date, isCurrentMonth }) => {
                  const isSelected =
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();
                  
                  const isToday = 
                    date.getDate() === startOfToday.getDate() &&
                    date.getMonth() === startOfToday.getMonth() &&
                    date.getFullYear() === startOfToday.getFullYear();

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      className={`${styles.calendarDayCell} ${
                        !isCurrentMonth ? styles.placeholderDay : ""
                      } ${isSelected ? styles.selectedDay : ""} ${isToday ? styles.todayDay : ""}`}
                      onClick={() => {
                        setSelectedDate(date);
                        setClickedHour(null);
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className={styles.dropdownDivider} />

              <div className={styles.dropdownSectionTitle}>Select Layout</div>
              <div className={styles.layoutToggleRow}>
                <button
                  type="button"
                  className={`${styles.layoutSelectBtn} ${layoutType === "card" ? styles.layoutSelectBtnActive : ""}`}
                  onClick={() => {
                    setLayoutType("card");
                    setClickedHour(null);
                  }}
                  aria-label="Block layout"
                >
                  <Grid size={16} />
                  <span>Block</span>
                </button>
                <button
                  type="button"
                  className={`${styles.layoutSelectBtn} ${layoutType === "timeline" ? styles.layoutSelectBtnActive : ""}`}
                  onClick={() => {
                    setLayoutType("timeline");
                    setClickedHour(null);
                  }}
                  aria-label="Timeline layout"
                >
                  <Clock size={16} />
                  <span>Timeline</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* VIEW LAYOUTS OR EMPTY STATE */}
      {layoutType === "card" && trips.length === 0 ? (
        <section className={styles.emptyState}>
          <EmptyStateIllustration />
          <h3>No Trip History Yet</h3>
          <p>You do not have any trip history recorded on Route. Start a trip to track your transit safety.</p>
          <button 
            className={`primary ${styles.ctaBtn}`} 
            onClick={() => router.push("/home?action=voice")}
          >
            Add a Trip
          </button>
        </section>
      ) : (
        <>
          {/* FILTER ACTIVE CHIP */}
          <div className={styles.activeFilterContainer}>
            <span className={styles.activeFilterChip}>
              Date: <strong>{selectedDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</strong>
              <button 
                onClick={() => {
                  setSelectedDate(startOfToday);
                  setViewingMonth(new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1));
                }} 
                aria-label="Reset to today"
                title="Reset to today"
              >
                <X size={12} />
              </button>
            </span>
          </div>

          {/* RENDER VIEW CARD LAYOUT */}
          {layoutType === "card" && (
            <>
              {filteredTrips.length === 0 ? (
                <section className={styles.emptyState}>
                  <EmptyStateIllustration />
                  <h3>No Matching Trips</h3>
                  <p>We couldn't find any trips matching your selected date or search filter.</p>
                  <button 
                    className={`primary ${styles.ctaBtn}`} 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDate(startOfToday);
                      setViewingMonth(new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1));
                    }}
                  >
                    Clear Filters
                  </button>
                </section>
              ) : (
                <section className={styles.tripList}>
                  {filteredTrips.map((trip) => (
                    <div
                      key={trip._id}
                      onClick={() => router.push(`/trip/${trip._id}`)}
                      className={styles.tripCard}
                    >
                      <div className={styles.tripCardHeader}>
                        <span className={styles.tripPlate}>
                          {privacyMode ? maskPlate(trip.plate) : trip.plate}
                        </span>
                        <span
                          className={`${styles.statusBadge} ${
                            trip.status === "active"
                              ? styles.statusActive
                              : trip.status === "safe"
                              ? styles.statusSafe
                              : trip.status === "pending-review"
                              ? styles.statusPending
                              : styles.statusIncident
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>

                      <div className={styles.tripCardBody}>
                        <span className={styles.tripMeta} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={12} /> {formatDate(trip.createdAt)}
                        </span>
                        <span className={styles.tripMeta} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <MapPin size={12} /> {trip.transportType}
                        </span>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}

          {/* RENDER VIEW TIMELINE LAYOUT */}
          {layoutType === "timeline" && (
            <div className={styles.timelineView}>
              {/* Timeline active day heading */}
              <div className={styles.timelineDayHeader}>
                <div className={styles.dayTitle}>
                  {formatTimelineHeaderDay(selectedDate)}
                </div>
                <div className={styles.daySubtitle}>
                  {formatTimelineHeaderSub(selectedDate)}
                </div>
              </div>

              {/* UX Polish: Show/Hide Early Midnight Hours */}
              <div className={styles.earlyHoursToggleContainer}>
                <button 
                  className={styles.earlyHoursToggleBtn}
                  onClick={() => {
                    setShowEarlyHours(!showEarlyHours);
                    setClickedHour(null);
                  }}
                >
                  <Clock size={13} />
                  {showEarlyHours ? "Hide Early Hours (12 AM - 4 AM)" : "Show Early Hours (12 AM - 4 AM)"}
                  {showEarlyHours ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Vertical 24 Hours timeline grid */}
              <div className={styles.timelineGrid}>
                {currentTimeLineOffset !== null && (
                  <div 
                    className={styles.currentTimeLine} 
                    style={{ top: currentTimeLineOffset }}
                  >
                    <div className={styles.currentTimeDot} />
                  </div>
                )}
                {hoursRange.map((h) => {
                  const tripsInHour = []; // Force no history in timeline view per request

                  const hasTrips = tripsInHour.length > 0;
                  const isClicked = clickedHour === h;

                  return (
                    <div key={h} className={styles.timelineRowWrapper}>
                      <div 
                        className={`${styles.timelineRow} ${hasTrips ? styles.hasTripsRow : styles.emptyRow}`}
                        onClick={() => {
                          if (!hasTrips) {
                            setClickedHour(isClicked ? null : h);
                          }
                        }}
                      >
                        <div className={styles.timelineHourCol}>
                          {formatHourLabel(h)}
                        </div>
                        <div className={styles.timelineContentCol} />
                      </div>

                      {/* Collapsible hour alert banner */}
                      {!hasTrips && isClicked && (
                        <div className={styles.clickedHourBanner}>
                          <div className={styles.clickedHourContent}>
                            {trips.length === 0 ? (
                              <span className={styles.clickedHourMessage}>
                                You have no trip logged for this hour.
                              </span>
                            ) : (
                              <span className={styles.clickedHourMessage}>
                                You have no history for this hour.
                              </span>
                            )}
                          </div>
                          <button 
                            className={styles.closeBannerBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setClickedHour(null);
                            }}
                            aria-label="Close message"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
