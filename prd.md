# Route — Product Requirements Document (PRD)
**Version:** Final  
**Built by:** Abimbola  
**Platform:** Mobile-only PWA  
**Scope:** Lagos State, Nigeria

---

## What Is Route?

Route is a passive-safety Progressive Web App for Lagos commuters. Before boarding any commercial vehicle, a user searches the vehicle's plate number. If that plate has been flagged by previous commuters, Route surfaces the flag count and incident history instantly.

Route does not make accusations. It does not contact authorities. It gives communities the infrastructure to warn each other — structured, searchable, and persistent — the way they already try to on WhatsApp and X, except it stays.

The safety mechanism works both ways. When a user logs a trip, their selected emergency contacts receive a push notification with vehicle details and live GPS coordinates. After the trip timer expires, those contacts receive a safety check: did they arrive safely? If the answer is no, the vehicle enters an incident review pipeline and can escalate to Dangerous status on the home screen.

Route is not only a commuter tool. It is a data engine. Every flagged plate, every route pattern, every time-of-day incident cluster builds a picture of transit insecurity in Lagos that the government currently has no structured source for. That data is Route's second product.

---

## Why This Matters Right Now

Lagos has no bushland. You cannot hide a kidnapping gang in the open. What Lagos has instead is vehicle-based abduction: criminal networks posing as commercial transport operators — Danfo drivers, Keke riders, Okada men — who move victims using the city's own transit infrastructure.

Between May 2023 and April 2024, the NBS recorded 2.23 million kidnapping incidents in Nigeria. Ransom payments hit ₦2.23 trillion in that same period. Kidnapping incidents increased over 400% between 2019 and 2023. In January 2026, Chinemerem Chukwumeziem was killed after boarding public transport home from work in Nigeria.

The threat is no longer distant from Lagos. Security analysts have raised concern about bandit and herder group activity extending into southwest Nigeria, including areas of Ogun and Oyo states that border Lagos, with the Lagos-Ibadan expressway corridor flagged as an area of growing concern. For a city that has historically felt insulated from rural banditry, that proximity has shifted public mood — Lagosians are increasingly aware that the security situation affecting other parts of the southwest is no longer someone else's problem.

Route exists at the exact moment when Lagos needs this infrastructure most — not as a response to a hypothetical, but to a vehicle-based threat that is already present in the city's transit system and a regional threat that is closing in on its borders.

The government angle is not "we built an app." It is: Route generates the structured vehicle-level transit intelligence that LASG, LAMATA, and the Lagos State Safety Commission currently cannot produce internally. Which routes are most reported. Which vehicles keep appearing. Which Okada man keeps deviating from his route. Which time windows are highest risk. That data is actionable. That data belongs in a ministry briefing.

---

## Full Feature List

---

### F1 — User Onboarding

- Sign up via email and password (Clerk)
- Optional: add display name
- No mandatory contacts setup
- No required location or push notification permission gates
- User lands directly on the home screen after quick profile setup

**Flow:**
Enter email/password → Optional display name → Home screen

---

### F2 — WhatsApp Trip Share Link Generation

- When a trip summary is logged, Route generates a unique public summary link (`/trip/[id]`)
- Commuter gets a **1-Tap "Share on WhatsApp"** button
- Tapping opens WhatsApp pre-populated with a clean, friendly message:
  *"I'm boarding a [Transport Type] ([Plate Number]) from [Boarding Location] to [Destination]. View vehicle summary: [URL]"*
- Loved ones opening the link view a clean web summary card showing vehicle info, boarding/destination details, community safety status badge, and Lagos emergency helpline numbers
- Requires no app download or account for loved ones opening the link

---

### F3 — Plate Search

- Primary action on the home screen
- User types a plate number or speaks it via voice
- **If plate exists in database:** return flag count, safety indicator colour badge, and incident history
- **If plate has never been registered:** offer two options — log a trip summary or return home
- Search is scoped to Lagos vehicles only

---

### F4 — Vehicle Plate Capture (Voice + Manual)

**Voice-to-text input:**
- A speaker icon triggers live speech-to-text using the Web Speech API, transcribing in real time as the user speaks the plate number.
- On completion, show a confirmation screen: "Confirm this is the right plate" with Yes / Edit options.
- Edit opens a text field pre-filled with the transcript so the user can manually correct it.
- Detect Web Speech API support on page load. If unsupported (e.g. unsupported browser), hide the mic icon and default to manual entry.

**Manual text input:**
- User types the plate number directly. Guaranteed fallback for all users.

**Vehicle description fields (optional dropdowns):**
- Colour: Red / Yellow / White / Black / Blue / Silver / Brown / Green / Other
- Windows: Tinted / Not tinted (Uber/Taxi only)
- Condition: Clean / Damaged or dented

---

### F5 — Trip Summary Logging

- Commuter logs a trip summary in under 10 seconds
- **Fields:**
  - Plate number (from F4 or manual)
  - Transport type: Danfo | Keke | Bike (Okada) | Uber/Taxi | Shuttle | Other
  - Boarding location (text input with auto-suggest / recent spots)
  - Destination (text input)
  - Vehicle description (optional dropdowns)
- **On Submit:**
  - Saves trip summary
  - Immediately displays 1-Tap "Share on WhatsApp" modal/action

---

### F6 — Vehicle Safety Status

Every vehicle record carries a community safety indicator badge based on report credibility:

| Status | Flag Count | Meaning |
|---|---|---|
| Safe | 0 flags | No reports registered |
| Mild | 1–2 flags | Single report / low count |
| Concern | 3+ flags | Multiple independent reports |
| Dangerous | 5+ flags or serious incident | High risk flagged by community |

---

### F7 — Community Incident Reporting & Trust Mechanics

- Commuter can anonymously report/flag a vehicle for: Harassment | Suspicious behaviour | Unsafe driving | Attempted robbery | Route deviation | Other.
- **Report Credibility Mechanic:** Vehicle flag count is surfaced to the public community once reported by 3 or more independent users.
- **Monthly Reporting Limit:** Maximum 3 vehicle flags per user per month.
- All reporting is strictly anonymous — reporter identity is never exposed.

---

### F8 — Saved Vehicles & Trip History

- User can save vehicles to their personal watchlist.
- View past logged trip summaries.
- **Trip Warning Gate:** If a user searches or logs a plate that exists in their saved list as flagged/dangerous, prominent warning banner is displayed.

- Displays flagged vehicles currently active in Lagos
- Categorised by offense type
- Dangerous-status vehicles appear at the top with a prominent warning label
- Feed updates in real time via Convex subscription
- User location is fixed to Lagos — no state switching

---

### F15 — Vehicle Safety Intelligence (User-Facing)

Each vehicle carries a safety indicator based on its flag history:

| Colour | Threshold |
|---|---|
| Green | No reports |
| Yellow | 1–2 previous reports |
| Orange | 3–5 reports or pattern detected |
| Red / Dangerous | Escalated by incident system |

- Indicator is visible on search results, home feed, and saved vehicles list
- No personally identifiable reporter data is ever shown
- Anonymised flag counts and incident categories only

---

### F16 — Admin Dashboard (Abimbola Only)

- Accessible only via Abimbola's Clerk account — no other user can reach this
- View all trips (paginated, most recent first)
- Search users by phone number
- Monitor all active incidents and their current status
- View vehicle risk trends by route and time of day
- View transport type distribution across incident reports
- Identify high-risk routes, high-risk time windows, and recurring vehicles
- Detect abuse patterns: spam flagging, suspicious flag velocity from a single user
- Export structured data in CSV: trip logs (anonymised), incident summaries, route patterns, safety trends

---

### F17 — Analytics and Intelligence Layer

- Powered by PostHog
- Tracks (anonymised and aggregated): route patterns (origin to destination), transport type usage, vehicle frequency, safety outcomes, incident triggers, time-of-day risk clusters, geography-based risk clusters, Okada route deviation patterns
- This layer is what makes Route a government-relevant product
- Zero personally identifiable information in this layer

**Key intelligence outputs this layer enables:**
- Which routes in Lagos are most flagged
- Which vehicles appear repeatedly across different users
- Which Okada or Danfo operators consistently deviate from expected routes
- Which time windows (e.g. 9pm–12am on specific corridors) carry highest incident rates
- Geographic heat map of boarding locations at time of incident

---

### F18 — Data Export (Government-Ready)

- Admin can trigger export at any time from the admin dashboard
- Export format: CSV
- Export includes: anonymised trip logs, aggregated route data, incident summaries, safety trend data, time-of-day breakdowns
- Export is structured to be handed directly to LASG, LAMATA, or the Lagos State Safety Commission without reformatting
- Rate limited: max 5 exports per hour

**Government entry points for this data:**
- LAMATA (Lagos Metropolitan Area Transport Authority) — route and vehicle enforcement
- Lagos State Safety Commission — public safety mandate
- LASG Ministry of Transportation — policy and regulatory oversight
- These are the three bodies most likely to act on structured transit safety data

---

### F19 — Account Recovery

- User logs in on any phone via registered email and password (Clerk)
- Full account restored on login: contacts (with activation status), trip history, saved vehicles
- Active trip remains accessible and visible if login happens mid-trip
- This ensures Route stays useful even if a user's phone is lost or taken during an incident

---

### F20 — Contributions (Optional Monetisation)

- Route is free to use for all core safety features — this never changes
- **Trip limit:** 3 trips per day on the free tier
- **Contributor tier:** ₦1,000/month unlocks unlimited daily trips
- Users can also contribute any voluntary amount at any time from the in-app prompt
- All contributions go toward infrastructure costs only
- Do not build a paywall around any safety-critical feature (plate search, safety check, emergency escalation)

---

### F21 — Privacy Controls

- User can remove any contact at any time — revocation is immediate
- User can enable local privacy mode to hide trip activity on their own device screen
- Termly handles cookie consent banner and privacy policy display
- All flagging is anonymous — this is enforced at the data layer, not just the UI

---

### F22 — Rate Limiting (Upstash — Mandatory)

Apply rate limiting at both the API route level and the Convex mutation level. No exceptions.

| Endpoint / Action | Limit |
|---|---|
| Plate search | 30 per user per hour |
| Trip logging | 3 per user per day (free), unlimited (contributor) |
| Vehicle flagging / reporting | 3 per user per month |
| Contact invite link generation | 10 per user per day |
| Post-ride survey submission | 5 per trip (anti-abuse) |
| Safety check response (contact side) | 10 responses per contact per day |
| Admin data export | 5 per hour |
| Any mutation touching the vehicles table | 50 per user per hour |

---

## Full Flow — What Happens Second by Second

### Before You Board
1. User opens Route on their phone
2. Types or speaks the plate number of the vehicle they are about to board
3. If the plate has reports: flag count, incident type, and safety indicator colour are shown immediately
4. If the plate is clean: user proceeds or logs a trip

### Logging a Trip
5. User selects voice or manual input
6. Voice: Web Speech API transcribes plate spoken by user, user confirms
7. Manual: user types plate, adds vehicle description
8. User selects transport type and boarding location (GPS auto-fills)
9. User selects check-in timer (default 1 hour)
10. User selects which contacts get the immediate alert and which single contact handles the safety check
11. User taps submit
12. FCM push notification fires instantly to alert contacts: plate, description, GPS coordinates
13. Safety check timer starts

### During the Trip
14. GPS coordinates stored periodically in the background
15. User's last known location is always current and accessible to contacts via the trip notification link

### After the Timer
16. FCM push notification fires to the designated safety check contact
17. Contact sees: "Did [name] arrive safely?" with vehicle details and last GPS location
18. Contact is prompted to call or check on the person before responding
19. Contact taps YES or NO (no app required, link opens in browser)

### If YES
20. Trip status moves to Safe
21. Post-ride survey fires for user: Smooth or Something felt off
22. If something felt off: user selects incident type, vehicle is anonymously flagged, flag count updates immediately

### If NO
23. Contact receives emergency link: plate, last GPS, Lagos emergency numbers
24. App waits 24 hours and follows up with the same contact
25. If contact still cannot confirm the user is safe: vehicle escalates to Dangerous status
26. Dangerous vehicle appears on the home screen feed for all Lagos users

### Next Time
27. Before the user can log a new trip: post-ride survey must be completed
28. If a previous survey is unanswered: app surfaces it first — one reminder allowed, then it is required

---

## Convex Schema (Build This Before Any Feature)

```
users
  - clerkId (string, indexed)
  - phone (string, indexed)
  - displayName (string, optional)
  - contributorStatus (boolean)
  - tripCountToday (number)
  - createdAt (timestamp)

contacts
  - userId (reference: users)
  - name (string)
  - relationship (string)
  - phone (string)
  - email (string, optional)
  - inviteTokenHash (string, indexed) — HMAC-SHA256 hash, never plaintext
  - inviteTokenExpiresAt (timestamp) — 7 days from generation
  - encryptedFcmToken (string, optional) — AES-256-GCM encrypted
  - status: "pending" | "active" | "unresponsive" | "removed"
  - missedCheckIns (number)
  - responseRate (number)
  - avgResponseTime (number, ms)
  - createdAt (timestamp)

trips
  - userId (reference: users)
  - plate (string, indexed)
  - transportType (string)
  - boardingLocation (string)
  - boardingGPS (object: encryptedLat, encryptedLng) — AES-256-GCM encrypted
  - timerExpiry (timestamp)
  - safetyContactId (reference: contacts)
  - alertContactIds (array of contact references)
  - safetyCheckTokenHash (string, indexed) — HMAC-SHA256 hash
  - safetyCheckTokenExpiresAt (timestamp) — 48 hours from trip creation
  - safetyCheckTokenUsed (boolean) — true after first use, invalidated immediately
  - status: "active" | "safe" | "pending-review" | "incident-triggered" | "resolved"
  - postRideAnswered (boolean)
  - createdAt (timestamp)

locationSnapshots
  - tripId (reference: trips)
  - encryptedLat (string) — AES-256-GCM encrypted
  - encryptedLng (string) — AES-256-GCM encrypted
  - capturedAt (timestamp)

safetyChecks
  - tripId (reference: trips)
  - contactId (reference: contacts)
  - response: "yes" | "no" | "stuck-in-traffic" | null
  - trafficRecheckCount (number) — increments each time "stuck in traffic" is selected
  - retryCount (number)
  - respondedAt (timestamp, optional)
  - followUpSent (boolean)
  - followUpResponse: "reached" | "not-reached" | null

vehicles
  - plate (string, indexed)
  - transportType (string)
  - description (string)
  - flagCount (number)
  - safetyIndicator: "green" | "yellow" | "orange" | "red"
  - dangerousStatus (boolean)
  - lastFlaggedAt (timestamp)
  - lastFlaggedLocation (object: encryptedLat, encryptedLng, optional) — AES-256-GCM encrypted

incidents
  - tripId (reference: trips)
  - plate (string, indexed)
  - incidentType (string)
  - source: "contact-no" | "missed-check" | "post-ride-survey"
  - status: "pending-review" | "verified-concern" | "resolved"
  - createdAt (timestamp)
  - resolvedAt (timestamp, optional)

postRideSurveys
  - tripId (reference: trips)
  - userId (reference: users)
  - response: "smooth" | "felt-off"
  - incidentType (string, optional)
  - submittedAt (timestamp)

savedVehicles
  - userId (reference: users)
  - plate (string)
  - savedAt (timestamp)

contributions
  - userId (reference: users)
  - amount (number)
  - type: "voluntary" | "monthly-tier"
  - tierUnlocked (boolean)
  - createdAt (timestamp)

adminLogs
  - adminClerkId (string)
  - action (string)
  - resourceType (string)
  - resourceId (string, optional)
  - timestamp (timestamp)

dataAccessLogs
  - userId (string) — anonymised Clerk ID
  - action (string) — e.g. "read:locationSnapshot", "read:contactPhone"
  - resourceType (string)
  - resourceId (string)
  - timestamp (timestamp)
  — append-only, never update or delete entries
```

---

## 7-Day Build Plan

Complete every item on each day fully before moving to the next day. Do not start Day 2 with anything from Day 1 unfinished. Each day ends with a timeline.md entry.

---

### Day 1 — Foundation
- Project setup: Next.js app, Convex connected, Clerk installed and configured
- All Convex tables created exactly as defined in the schema section of this PRD
- Clerk email/password login working end to end: enter email & password, land on app
- Protected routes: unauthenticated users cannot access any page except login
- Account recovery working: login on a new device restores full account
- Basic mobile shell running correctly on both Android and iOS browsers

---

### Day 2 — Onboarding and Contact System
- Full onboarding flow: phone entry, display name, contact setup gate, location permission, notification permission
- User cannot pass onboarding without adding minimum 2 contacts
- Contact system: add contact, generate unique invite link, copy to share via WhatsApp
- Invite link landing page: detects iOS vs Android, shows home screen add instructions, enables push notifications after home screen step is confirmed
- Contact statuses working: Pending, Active, Unresponsive, Removed
- Removing a contact revokes access immediately
- Resend invite link working from profile screen
- FCM push notification delivery confirmed working on both Android and iOS (home screen added)

---

### Day 3 — Plate Search and Capture
- Plate search on home screen: returns flag count, safety indicator colour, incident history if plate exists
- If plate does not exist: offer log a trip or return home
- Voice input: microphone icon triggers Web Speech API, transcribes spoken plate number, user sees confirmation screen
- If voice detection is unsupported or fails: automatic fallback to manual text entry, hide mic button if Web Speech API is not available
- Manual input: user types plate number
- Vehicle description dropdowns: Colour, Windows, Condition — all skippable, all dropdowns not text fields
- User confirms plate with YES/NO — NO sends them to manual input
- Confirmed plate carries into trip logging
- Upstash rate limiting applied: plate search and flagging (monthly limit)

**End of Day 3 — agent writes 3-day summary in timeline.md**

---

### Day 4 — Trip Logging and GPS
- Full trip logging form: plate (from capture), transport type dropdown, boarding location (GPS auto-fill with manual override), timer dropdown (15min / 30min / 1hr / 2hr / 3hr — default 1hr)
- Contact selection: multi-select for alert contacts, single select for safety check contact
- On submit: FCM push notification fires immediately to alert contacts with plate, description, transport type, boarding location, live GPS
- Safety check timer starts on submit
- GPS location snapshot stored every 2 minutes during active trip
- Last known location always current and accessible
- Trip gate: cannot log new trip while previous post-ride survey is unanswered
- Daily trip limit enforced: 3 free, unlimited for contributors
- Upstash rate limiting applied on trip logging mutation

---

### Day 5 — Safety Check System and Post-Ride Survey
- Timer expiry fires FCM push notification to designated safety check contact
- Notification copy: "Did [name] arrive safely? Call or check on them before responding. This is a real safety tool."
- Contact opens link, sees YES / NO buttons, responds — no app required
- YES flow: trip status moves to Safe, post-ride survey prompt fires for user
- NO flow: contact sees loading animation while app fetches last known location and full vehicle details, then receives plate, description, last GPS, Lagos emergency numbers (LASEMA 767, Police 112)
- 24-hour follow-up fires to same contact after NO response
- Escalation: contact still cannot confirm user is safe after 24 hours AND user has not answered post-ride survey — vehicle escalates to Dangerous status
- Post-ride survey: Smooth or Something felt off — if felt off, incident type dropdown fires (Harassment / Suspicious behaviour / Unsafe driving / Attempted robbery / Route deviation / Other)
- Anonymous flagging: vehicle flag count updates immediately, reporter identity never stored
- Trip status state machine working: Active, Safe, Pending Review, Incident Triggered, Resolved
- Retry logic: 3 retries on unanswered safety check, then contact marked unresponsive for that trip

**End of Day 5 — agent writes 3-day summary in timeline.md**

---

### Day 6 — Feed, Vehicles, Incidents, PWA
- Home screen feed: flagged vehicles in Lagos, categorised by offense type, real-time Convex subscription
- Dangerous vehicles surfaced at top of feed with prominent warning
- Vehicle safety indicators: Green, Yellow, Orange, Red — logic matches thresholds defined in F15
- Saved vehicles: save from search results, accessible offline, own vs others display rules enforced
- Incident system: creation triggers, Pending Review, Verified Concern, Resolved states
- PWA configuration: app manifest, service worker, offline support for saved vehicles, installable on home screen
- Full offline access confirmed for saved vehicles list

---

### Day 7 — Admin, Analytics, QA, Final
- Admin dashboard: accessible only via Abimbola's Clerk account, all views as defined in F16
- PostHog events wired up for all key actions defined in F17
- CSV export working from admin dashboard
- Sentry installed and capturing errors live
- Termly cookie consent banner and privacy policy live
- Contribution flow: ₦1,000/month tier unlock, voluntary contribution prompt, trip counter enforced
- Privacy mode working
- End-to-end flow test: full trip from plate search to safety check to post-ride survey on both Android and iOS
- All broken, incomplete, or inconsistent features fixed before calling Day 7 done

**End of Day 7 — agent writes final 3-day summary in timeline.md**

---

## timeline.md Rules

This file is private. It is never committed to GitHub. It lives locally and is copied manually for capstone submission every 3 days.

**Agent rules for timeline.md:**
- After Day 3, Day 5, and Day 7: write a bullet-point summary at the bottom of `timeline.md` under a new dated heading
- Never commit this file to GitHub under any circumstance
- Do not summarise what was planned — summarise only what was actually built and confirmed working

**Format:**
```
## [Date] — Day [N] Summary
- [What was built]
- [What was configured]
- [Any decisions made or problems solved]
- [Anything that did not work and how it was fixed]
```

---

## What Route Is Not

- Not a law enforcement tool
- Not a surveillance platform
- Not a second-by-second live streaming tracker (Google Maps style) — location is captured as frequent periodic snapshots throughout the active trip, so the contact always receives the most recent known location, not the boarding location. As long as the user's phone is on, snapshots keep updating. The last snapshot before the phone goes dark is what the contact sees when they click NO.
- Not a multi-state product — Lagos is the product, not a starting point
- Not a paywall product — core safety features are always free

---

*Route was built in response to a real and ongoing public safety crisis in Lagos and across Nigeria. The data infrastructure this app creates could tell a story that changes how the government responds to vehicle-based crime. Build it right.*