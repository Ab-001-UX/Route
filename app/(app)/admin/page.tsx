"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  ShieldAlert, 
  History, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  UserX, 
  Download, 
  Loader2, 
  CheckCircle,
  FileSpreadsheet,
  XCircle
} from "lucide-react";
import styles from "./admin.module.css";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"trips" | "incidents" | "analytics" | "abuse">("trips");
  
  // Trips pagination state
  const [tripsOffset, setTripsOffset] = useState(0);
  const tripsLimit = 10;
  const [phoneSearchQuery, setPhoneSearchQuery] = useState("");

  // Convex setup
  const tripsData = useQuery(api.admin.getAdminTrips, { limit: tripsLimit, offset: tripsOffset });
  const searchResults = useQuery(api.admin.searchUsersByPhone, { searchQuery: phoneSearchQuery });
  const incidents = useQuery(api.admin.getActiveIncidents);
  const riskTrends = useQuery(api.admin.getRiskTrends);
  const abusePatterns = useQuery(api.admin.detectAbusePatterns);
  const resolveIncident = useMutation(api.admin.resolveIncident);

  // States
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [exportError, setExportError] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Handle CSV Export API call
  const handleCSVExport = async () => {
    setIsExporting(true);
    setExportMessage("");
    setExportError("");

    try {
      const res = await fetch("/api/admin/export", { method: "POST" });
      if (res.status === 429) {
        throw new Error("Export rate limit exceeded. Max 5 exports per hour.");
      }
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to download export.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `route_anonymized_trips_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage("CSV exported successfully!");
    } catch (err: any) {
      setExportError(err.message || "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Incident Resolution
  const handleResolveIncident = async (id: any, newStatus: "verified-concern" | "resolved") => {
    setResolvingId(id);
    try {
      await resolveIncident({ incidentId: id, status: newStatus });
    } catch (err) {
      console.error("Resolve incident failed:", err);
    } finally {
      setResolvingId(null);
    }
  };

  // Check if unauthorized (identifiable if queries fail or return error)
  const isUnauthorized = tripsData === null && incidents === null;

  if (isUnauthorized) {
    return (
      <main className={styles.container} style={{ justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className={styles.unauthorizedCard}>
          <ShieldAlert size={48} className={styles.alertIcon} />
          <h2>Access Restricted</h2>
          <p>This panel is accessible to administrator Clerk accounts only.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.subtitle}>Route safety metrics, trip reports & audit logs.</p>
        </div>
        <button 
          onClick={handleCSVExport} 
          className="primary" 
          disabled={isExporting}
          style={{ minHeight: "44px", height: "44px" }}
        >
          {isExporting ? <Loader2 className={styles.spin} size={16} /> : <Download size={16} />}
          <span>Export CSV</span>
        </button>
      </header>

      {/* Export Notifications */}
      {exportMessage && <div className={styles.successBanner}><CheckCircle size={18} /> {exportMessage}</div>}
      {exportError && <div className={styles.errorBanner}><XCircle size={18} /> {exportError}</div>}

      {/* Tabs */}
      <nav className={styles.tabNav}>
        <button 
          className={`${styles.tabBtn} ${activeTab === "trips" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("trips")}
        >
          <History size={16} /> Trips
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === "incidents" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("incidents")}
        >
          <AlertTriangle size={16} /> Incidents
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === "analytics" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <TrendingUp size={16} /> Analytics
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === "abuse" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("abuse")}
        >
          <UserX size={16} /> Abuse Check
        </button>
      </nav>

      <section className={styles.content}>
        {/* TAB 1: TRIPS HISTORY & SEARCH */}
        {activeTab === "trips" && (
          <div className={styles.tabPanel}>
            <div className={styles.searchBarWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search commuter phone number (e.g. +23480)..."
                value={phoneSearchQuery}
                onChange={(e) => {
                  setPhoneSearchQuery(e.target.value);
                  setTripsOffset(0); // Reset offset on query
                }}
                className={styles.searchInput}
              />
            </div>

            {phoneSearchQuery ? (
              // Search results list
              searchResults === undefined ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                  <Skeleton variant="rectangular" width="100%" height={60} />
                  <Skeleton variant="rectangular" width="100%" height={60} />
                </div>
              ) : searchResults.length === 0 ? (
                <p className={styles.emptyText}>No users found matching query phone number.</p>
              ) : (
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Display Name</th>
                        <th>Phone</th>
                        <th>Registered Date</th>
                        <th>Daily Limit Tier</th>
                        <th>Total Trips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((u) => (
                        <tr key={u._id}>
                          <td><strong>{u.displayName}</strong></td>
                          <td>{u.phone}</td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={u.contributorStatus ? styles.tierPremium : styles.tierFree}>
                              {u.contributorStatus ? "Contributor" : "Free"}
                            </span>
                          </td>
                          <td>{u.tripCount} trips</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              // Default paginated trips list
              tripsData === undefined ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                  <Skeleton variant="rectangular" width="100%" height={60} />
                  <Skeleton variant="rectangular" width="100%" height={60} />
                </div>
              ) : tripsData.trips.length === 0 ? (
                <p className={styles.emptyText}>No trips logged in Lagos yet.</p>
              ) : (
                <>
                  <div className={styles.tableCard}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Commuter</th>
                          <th>Vehicle Plate</th>
                          <th>Transport Type</th>
                          <th>Boarding Location</th>
                          <th>Check-in Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tripsData.trips.map((t) => (
                          <tr key={t._id}>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <strong>{t.displayName}</strong>
                                <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{t.phone}</span>
                              </div>
                            </td>
                            <td><span className={styles.badgePlate}>{t.plate}</span></td>
                            <td>{t.transportType}</td>
                            <td>{t.boardingLocation.split("(")[0]}</td>
                            <td>
                              <span className={`${styles.statusText} ${styles[`status_${t.status}`]}`}>
                                {t.status}
                              </span>
                            </td>
                            <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.paginationControls}>
                    <button 
                      className="secondary" 
                      disabled={tripsOffset === 0} 
                      onClick={() => setTripsOffset(prev => Math.max(0, prev - tripsLimit))}
                      style={{ minHeight: "36px", padding: "0 12px" }}
                    >
                      Previous
                    </button>
                    <span>
                      Page {Math.floor(tripsOffset / tripsLimit) + 1} of {Math.ceil(tripsData.totalCount / tripsLimit) || 1}
                    </span>
                    <button 
                      className="secondary" 
                      disabled={tripsOffset + tripsLimit >= tripsData.totalCount} 
                      onClick={() => setTripsOffset(prev => prev + tripsLimit)}
                      style={{ minHeight: "36px", padding: "0 12px" }}
                    >
                      Next
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* TAB 2: INCIDENTS LOGS */}
        {activeTab === "incidents" && (
          <div className={styles.tabPanel}>
            {incidents === undefined ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Skeleton variant="rectangular" width="100%" height={90} />
                <Skeleton variant="rectangular" width="100%" height={90} />
              </div>
            ) : incidents.length === 0 ? (
              <div className={styles.emptyIncidentsCard}>
                <CheckCircle size={32} style={{ color: "var(--color-safety-status-safe)" }} />
                <h3>No Unresolved Incidents</h3>
                <p>Great! All incident reviews have been verified or closed by admin audits.</p>
              </div>
            ) : (
              <div className={styles.incidentsGrid}>
                {incidents.map((inc) => (
                  <div key={inc._id} className={styles.incidentCard}>
                    <div className={styles.incCardHeader}>
                      <div>
                        <span className={styles.incPlate}>{inc.plate}</span>
                        <span className={styles.incSourceBadge}>{inc.source}</span>
                      </div>
                      <span className={styles.incDate}>{new Date(inc.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={styles.incCardBody}>
                      <div className={styles.incDetails}>
                        <p><strong>Commuter:</strong> {inc.commuterName} ({inc.commuterPhone})</p>
                        <p><strong>Location:</strong> {inc.boardingLocation}</p>
                        <p><strong>Trigger reason:</strong> <span style={{ color: "var(--color-safety-status-dangerous)" }}>{inc.incidentType}</span></p>
                      </div>
                      <div className={styles.incActions}>
                        <button 
                          className="secondary"
                          onClick={() => handleResolveIncident(inc._id, "verified-concern")}
                          disabled={resolvingId === inc._id || inc.status === "verified-concern"}
                          style={{ minHeight: "36px", height: "36px", padding: "0 12px" }}
                        >
                          Verify Pattern
                        </button>
                        <button 
                          className="primary"
                          onClick={() => handleResolveIncident(inc._id, "resolved")}
                          disabled={resolvingId === inc._id}
                          style={{ minHeight: "36px", height: "36px", padding: "0 12px", background: "var(--color-safety-status-safe)", boxShadow: "none" }}
                        >
                          Resolve / Close
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAFETY ANALYTICS & RISKS */}
        {activeTab === "analytics" && (
          <div className={styles.tabPanel}>
            {riskTrends === undefined ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <Skeleton variant="rectangular" width="100%" height={200} />
                <Skeleton variant="rectangular" width="100%" height={200} />
              </div>
            ) : (
              <div className={styles.analyticsGrid}>
                {/* 1. SEVERITY SUMMARY CARD */}
                <div className={styles.analyticsCard}>
                  <h3>Lagos Fleet Status Ratio</h3>
                  <div className={styles.severityMetrics}>
                    <div className={styles.sevItem}>
                      <span className={`${styles.sevLabel} ${styles.labelGreen}`}>Green (Safe)</span>
                      <strong>{riskTrends.severityDistribution.green} vehicles</strong>
                    </div>
                    <div className={styles.sevItem}>
                      <span className={`${styles.sevLabel} ${styles.labelYellow}`}>Yellow (1-2 flags)</span>
                      <strong>{riskTrends.severityDistribution.yellow} vehicles</strong>
                    </div>
                    <div className={styles.sevItem}>
                      <span className={`${styles.sevLabel} ${styles.labelOrange}`}>Orange (3-5 flags)</span>
                      <strong>{riskTrends.severityDistribution.orange} vehicles</strong>
                    </div>
                    <div className={styles.sevItem}>
                      <span className={`${styles.sevLabel} ${styles.labelRed}`}>Red / Dangerous</span>
                      <strong>{riskTrends.severityDistribution.red} vehicles</strong>
                    </div>
                  </div>
                </div>

                {/* 2. TOP RISK ROUTES CARD */}
                <div className={styles.analyticsCard}>
                  <h3>High-Report Corridor Heatmap</h3>
                  {riskTrends.topRiskRoutes.length === 0 ? (
                    <p className={styles.emptyText}>No routes flagged in Lagos yet.</p>
                  ) : (
                    <div className={styles.routeRanks}>
                      {riskTrends.topRiskRoutes.map((r, i) => (
                        <div key={i} className={styles.rankItem}>
                          <span className={styles.rankNum}>#{i + 1}</span>
                          <span className={styles.rankRoute}>{r.route}</span>
                          <strong>{r.count} reports</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. INCIDENTS BY TRANSPORT TYPE */}
                <div className={styles.analyticsCard} style={{ gridColumn: "span 2" }}>
                  <h3>Incident Density by Transit Vehicle Type</h3>
                  <div className={styles.transitDist}>
                    {riskTrends.transportTypeDistribution.map((t, i) => (
                      <div key={i} className={styles.distBarWrapper}>
                        <div className={styles.distLabel}>{t.type}</div>
                        <div className={styles.distTrack}>
                          <div 
                            className={styles.distFill} 
                            style={{ 
                              width: `${Math.min(100, (t.count / (riskTrends.topRiskRoutes[0]?.count || 1)) * 100)}%` 
                            }} 
                          />
                        </div>
                        <div className={styles.distCount}>{t.count} reports</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ABUSE CHECKS */}
        {activeTab === "abuse" && (
          <div className={styles.tabPanel}>
            {abusePatterns === undefined ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Skeleton variant="rectangular" width="100%" height={60} />
                <Skeleton variant="rectangular" width="100%" height={60} />
              </div>
            ) : abusePatterns.length === 0 ? (
              <div className={styles.emptyIncidentsCard}>
                <CheckCircle size={32} style={{ color: "var(--color-safety-status-safe)" }} />
                <h3>No Suspicious Velocity Detected</h3>
                <p>All flagging activities conform with normal Lagos passenger patterns.</p>
              </div>
            ) : (
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Commuter</th>
                      <th>Phone</th>
                      <th>Total Surveys</th>
                      <th>Flags Raised</th>
                      <th>Flag Ratio</th>
                      <th>Unique plates flagged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abusePatterns.map((u) => (
                      <tr key={u.userId}>
                        <td><strong>{u.displayName}</strong></td>
                        <td>{u.phone}</td>
                        <td>{u.totalTrips}</td>
                        <td><span style={{ color: "var(--color-safety-status-dangerous)", fontWeight: 700 }}>{u.flaggedTrips}</span></td>
                        <td><strong>{u.flagRatio}%</strong></td>
                        <td>{u.uniquePlatesCount} plates</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
