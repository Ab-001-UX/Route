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
- Mandatory: user must register 2–5 emergency contacts before accessing the app
- Minimum 2 contacts must be designated as safety responders
- Location permission requested during onboarding
- Push notification permission requested during onboarding
- User cannot proceed past onboarding without completing contact setup

**Flow:**
Enter email/password → Phone entry → Display name → Add contacts (minimum 2, maximum 5) → Grant location permission → Grant notification permission → Land on home screen

---

### F2 — Contact System

- Each contact stores: name, relationship label, phone number, optional email
- App generates a unique invite link per contact
- User sends the link manually from their own WhatsApp — not from inside the app
- Contact opens link in their phone browser, taps to enable push notifications once
- Contact requires no app download, no account, no technical knowledge
- Contact statuses: **Pending** (link not activated) | **Active** (notifications enabled) | **Unresponsive** (5+ missed check-ins) | **Removed** (access fully revoked)
- Removing a contact immediately and permanently revokes all their access — past and future
- If a contact misses 5 consecutive safety check-ins, user is notified and prompted to keep or replace them
- Contact reliability score tracked per contact: response rate, missed check-ins, average response time
- User can resend any contact's invite link at any time from the profile screen
- Contacts can be edited (name, relationship) or removed at any time from profile

---

### F3 — Plate Search

- Primary action on the home screen
- User types a plate number and searches
- **If plate exists in database:** return flag count, safety indicator colour, and incident history
- **If plate has never been registered:** offer two options — log it as a trip, or return home
- Search is scoped to Lagos vehicles only
- Search result displays transport type and vehicle description if logged by previous users

---

### F4 — Vehicle Plate Capture (Voice + Manual)

**Voice-to-text input:**
- A speaker icon triggers live speech-to-text using the Web Speech API, transcribing in real time as the user speaks the plate number.
- On completion, show a confirmation screen: "Confirm this is the right plate" with Yes / Edit options.
- Edit opens a text field pre-filled with the transcript so the user can manually correct it.
- Detect Web Speech API support on page load. If unsupported or unreliable (such as in iOS standalone PWA mode), hide the voice/mic option entirely and default to manual text entry only. Never show a mic button that does not work.
- If speech recognition fails, errors, or times out mid-capture, fall back to manual text entry with any partial transcript pre-filled.

**Manual text input:**
- User types the plate number directly.
- Manual entry is always available as a parallel, independent option, not gated behind voice failing or being unsupported.
- This is the guaranteed fallback for every user regardless of device or environment.

**Vehicle description fields (shown after plate is confirmed — all dropdowns, all skippable except plate):**

These fields exist so a contact or witness can identify the vehicle fast on the street. Keep the UI as quick dropdowns only, no text inputs.

| Field | Applies to | Options |
|---|---|---|
| Colour | All vehicles | Red / Yellow / White / Black / Blue / Silver / Brown / Green / Other |
| Windows | Uber and personal taxi only — hidden for Danfo, Keke, Okada, Shuttle | Tinted / Not tinted |
| Condition | All vehicles | Clean / Damaged or dented |

- All fields are optional — user can skip any or all of them
- Tinted/not tinted field must not appear for Danfo, Keke, Okada, or Shuttle under any circumstance
- If user skips all fields, only plate and transport type carry forward — that is still sufficient

**After confirmation:**
- Plate number and any selected description fields carry through directly to trip logging

---

### F5 — Trip Logging

- User logs a trip in under 10 seconds
- **Required fields:**
  - Plate number (from F4)
  - Transport type: Danfo | Keke | Bike (Okada) | Uber/Bolt | Shuttle | Other
  - Boarding location (auto-filled from GPS, or user can type)
  - Check-in timer: user sets this via dropdown — **15 mins | 30 mins | 1 hour | 2 hours | 3 hours**. Default pre-selected value is **1 hour**. User can change it before submitting.
- **Contact selection:**
  - User selects which Active contacts receive the immediate push notification alert
  - User selects one contact who will receive the safety check when the timer expires
- **On submit:**
  - Immediate push notification fires to all selected alert contacts with: plate number, vehicle description, transport type, boarding location, and user's live GPS coordinates
  - Safety check timer starts
- **Gate:** User cannot log a new trip while a previous trip's post-ride questions remain unanswered
- **Daily trip limit:** 3 free trips per day. Contributors (₦1,000/month) get unlimited daily trips

---

### F6 — Safety Check Timer

- Timer starts the moment a trip is logged
- Timer duration is set by the user at trip logging — default 1 hour
- Timer options available via dropdown: 15 mins | 30 mins | 1 hour | 2 hours | 3 hours
- On expiry: the selected safety check contact receives a push notification
- Notification content: "Did [name] arrive safely? Please call or beep them before responding. This is a real safety tool — do not dismiss this."
- Notification carries: vehicle plate, description, boarding location, last known GPS coordinates
- Contact responds via the notification link with one of three options: **YES** | **NO** | **Stuck in traffic** (no app required)
- **If no response:** system retries up to 3 times with increasing intervals. After 3 failures, contact is marked unresponsive for this trip and user is notified inside the app

---

### F7 — Safety Check Responses

**If the contact responds YES:**
- Trip status moves to Safe
- Post-ride survey prompt fires for the user (see F9)

**If the contact responds "Stuck in traffic":**
- Trip status remains Active — no escalation, no incident created
- A new safety check is scheduled for 45 minutes later to the same contact
- This re-check can repeat — if the contact responds "Stuck in traffic" again, another 45-minute check is scheduled
- This option exists specifically to prevent false escalations caused by Lagos traffic delays

**If the contact responds NO:**
- Contact immediately receives a link containing: plate number, vehicle description, user's last known GPS location, Lagos emergency contact numbers (LASEMA 767, Police 112, others)
- App starts a 24-hour follow-up window
- After 24 hours: app sends the same contact a follow-up — "Have you been able to reach [name]?"
- **Escalation condition:** If contact confirms no AND user has not answered their post-ride questions within 24 hours → vehicle is escalated to **Dangerous** status
- Dangerous vehicles are surfaced prominently on the home screen feed for all Lagos users

---

### F8 — Trip Safety Status

Every trip carries one of these statuses at all times:

| Status | Meaning |
|---|---|
| Active | Trip is in progress, timer running |
| Safe | Contact confirmed arrival |
| Pending Review | Contact said no or timer expired without response |
| Incident Triggered | Escalation conditions met |
| Resolved | Admin or user closed the incident |

Status is visible in the user's trip history at all times.

---

### F9 — Post-Ride Survey & Trust-and-Safety Mechanics

- Fires after every trip — regardless of whether the contact said yes or no.
- One-tap response: **Smooth** or **Something felt off**.
- **If Smooth:** trip closes, no follow-up.
- **If Something felt off:** user selects incident type from: Harassment | Suspicious behaviour | Unsafe driving | Attempted robbery | Route deviation | Other.
- **Report Credibility Mechanic:** To prevent the flagging feature from being used for personal disputes, jokes, or spite rather than genuine safety issues, a vehicle flag is only considered credible and surfaced/displayed to other users once it has been reported by 3 or more independent users.
- **Monthly Reporting Rate Limit:** A single user can flag a maximum of 3 plates per month.
- Vehicle is anonymously flagged in the community database.
- Flag count updates and is surfaced only once the credibility threshold is met.
- All flagging is anonymous — reporter identity is never stored or displayed.
- **Gate:** User cannot log a new trip until previous post-ride questions are answered.
- User can delay once with "Remind me later" — on the second prompt, it is required before a new trip is logged.

---

### F10 — Live Trip Tracking (Lightweight)

- GPS coordinates stored periodically during an active trip — not continuous streaming
- Last known location is always available to safety contacts through the trip notification link
- No map visible to the user during the trip — this is background location capture only
- If a user logs into a new device during an active trip: the active trip remains visible and accessible

---

### F11 — Incident System

Incidents are created by any of these triggers:
- Contact responds NO to a safety check
- Safety check is missed by all selected contacts after retries
- Post-ride survey reports something felt off

**Incident states:**

| State | Meaning |
|---|---|
| Pending Review | Incident created, not yet verified |
| Verified Concern | Pattern detected or admin confirms credibility |
| Resolved | Closed by admin or user |

- Incidents are not immediately public — only the flag count and incident category are visible to other users
- No accusation details, no reporter identity, no individual trip data shown publicly
- Admin can review, escalate, or resolve incidents from the admin dashboard

---

### F12 — Contact Notifications

- Primary channel: Firebase Cloud Messaging (FCM) push notifications
- Fallback channel: email, if the contact provided an email address during invite activation
- If push notification delivery fails: user is notified inside the app
- All notification copy must be human-readable, specific, and action-oriented — not generic system messages
- Notification types: trip alert (immediate) | safety check (timer-based) | follow-up (24hr) | reliability warning (5 missed check-ins)

---

### F13 — Saved Vehicles

- User can save any vehicle directly from search results
- Saved vehicles list is accessible offline with no data connection required
- **Vehicles flagged by the user themselves:** display plate number and offense type only
- **Vehicles flagged by other users:** display full details — incident history, flag count, last known location at time of flag, safety indicator colour
- User can remove any saved vehicle at any time
- **Trip Warning Gate:** If a user attempts to log a trip or scans a plate number that exists in their saved list (especially dangerous or flagged vehicles), the app will display a prominent warning banner reminding them that they saved this vehicle as one they should not board.

---

### F14 — Home Screen Feed

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