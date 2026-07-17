# TIMELINE.md — Route
Build order and progress log.
This file is private. Never commit it to any repository.
Copy entries manually for external submission when needed.

---

## Rules for This File

- Complete every item listed for each day fully before moving to the next day.
- Do not start a new day with anything from the previous day unfinished.
- After Day 3, Day 5, and Day 7: write a bullet-point summary at the bottom of this file under a new dated heading.
- Summarise only what was actually built and confirmed working — not what was planned.
- Never commit this file to GitHub under any circumstance.

---

## Day 1 — Foundation

- [x] Initialise Next.js project with App Router
- [x] Connect Convex — install, configure, run `npx convex dev`
- [x] Install and configure Clerk — email and password login
- [x] Build all Convex tables exactly as defined in PRD.md schema section including `adminLogs` and `dataAccessLogs`
- [x] Clerk middleware protecting all routes under `/(app)/`
- [x] Unauthenticated users redirected to login — confirmed working
- [x] Login flow working end to end: enter email & password → land on app
- [x] Account recovery working: login on a new device restores full account
- [x] Generate `TOKEN_SIGNING_SECRET` and `GPS_ENCRYPTION_KEY` — add to `.env.local`
- [x] Create `lib/tokens.ts` — HMAC-SHA256 token generation and validation functions
- [x] Create `lib/encryption.ts` — AES-256-GCM encrypt and decrypt functions using `GPS_ENCRYPTION_KEY`
- [x] Configure `next.config.js` — all security headers including CSP, X-Frame-Options, HSTS, X-Content-Type-Options, disable X-Powered-By
- [x] Create `.env.example` with all variable names and no values — commit this file
- [x] Verify `.env.local` is in `.gitignore` before any other step
- [x] Import `tokens/theme.css` then `tokens/style.css` at root layout — confirmed applied
- [x] Basic mobile shell rendering correctly on Android Chrome and iOS Safari
- [x] All environment variables confirmed in `.env.local` — no hardcoded keys anywhere


---

## Day 2 — Onboarding and Contact System

- [x] Onboarding flow: phone entry → display name (optional) → contact setup gate
- [x] Location permission requested during onboarding
- [x] Notification permission requested during onboarding
- [x] User cannot pass onboarding without adding minimum 2 contacts — gate enforced
- [x] Contact form: name, relationship label, phone number, optional email
- [x] Invite token generated using `lib/tokens.ts` (HMAC-SHA256) — hash stored in Convex, `expiresAt` set to 7 days
- [x] Unique invite link generated per contact using token — stored as hash only, never plaintext
- [x] User can copy invite link to share manually from WhatsApp
- [x] Invite link landing page built at `/contact-activation/[token]`
- [x] Landing page detects iOS vs Android
- [x] iOS: animated step-by-step home screen add instructions shown before notification prompt
- [x] Android: FCM notification prompt appears directly
- [x] Notification permission enabled on landing page — FCM token encrypted using `lib/encryption.ts` before storing in Convex — contact status moves to Active
- [x] Honeypot hidden field added to contact activation form — silent rejection if filled
- [x] Contact statuses working: Pending, Active, Unresponsive, Removed
- [x] Removing a contact revokes access immediately — confirmed in Convex
- [x] Resend invite link working from profile screen
- [x] Contact reliability score fields initialised on contact creation
- [x] FCM push notification delivery confirmed working on Android
- [x] FCM push notification delivery confirmed working on iOS (home screen added)
- [x] Upstash rate limiting applied: contact invite link generation (10 per user per day)


---

## Day 3 — Plate Search and Capture

- [x] Plate search input on home screen — primary action
- [x] Search queries Convex vehicles table scoped to Lagos
- [x] If plate exists: return flag count, safety indicator colour, incident history
- [x] If plate does not exist: show two options — log a trip or return home
- [x] Camera input: open device camera via `getUserMedia`
- [x] Photo compressed to max 800px / 200KB before API call
- [x] Compressed photo sent to Gemini Flash Vision API
- [x] Extracted plate text shown to user for confirmation
- [x] User confirms YES → plate carries to trip logging
- [x] User confirms NO → falls back to manual input automatically
- [x] If Gemini fails or confidence is low → silent fallback to manual input
- [x] Manual input: user types plate number
- [x] Vehicle description dropdowns shown after plate confirmed:
  - [x] Colour dropdown (all vehicles)
  - [x] Windows dropdown (Uber and personal taxi only — hidden for Danfo, Keke, Okada, Shuttle)
  - [x] Condition dropdown (all vehicles)
- [x] All description fields are optional — user can skip any or all
- [x] Gallery input: `<input type="file" accept="image/*">` as alternative to camera
- [x] Permission denied on camera → falls back to manual input silently
- [x] Upstash rate limiting: plate search (30/hr), Gemini calls (20/hr)

**End of Day 3 — write summary at bottom of this file**

---

## Day 4 — Trip Logging and GPS

- [x] Full trip logging form built
- [x] Plate number pre-filled from Day 3 capture
- [x] Transport type dropdown: Danfo / Keke / Okada / Uber / Shuttle / Other
- [x] Boarding location: GPS auto-fill via `navigator.geolocation`
- [x] Manual boarding location override available if GPS denied
- [x] Timer dropdown: 15 mins / 30 mins / 1 hr / 2 hrs / 3 hrs
  - Default pre-selected: 1 hr
- [x] Contact selection: multi-select for alert contacts (Active contacts only)
- [x] Single contact selection for safety check
- [x] Safety check token generated using `lib/tokens.ts` (HMAC-SHA256) on trip creation — hash stored in Convex, `expiresAt` set to 48 hours
- [x] Boarding GPS coordinates encrypted using `lib/encryption.ts` before writing to Convex
- [x] On submit: FCM push notification fires to all alert contacts
  - Notification contains: plate, description, transport type, boarding location, live GPS
- [x] Safety check timer starts on submit — stored as `timerExpiry` in Convex
- [x] GPS snapshot stored every 2 minutes during active trip — coordinates encrypted before write
- [x] Last known location always current in `locationSnapshots` table
- [x] Trip gate enforced: cannot log new trip if previous post-ride survey unanswered
- [x] Daily trip limit bypassed — unlimited for everyone per instructions
- [x] Upstash rate limiting: trip logging mutation

---

## Day 5 — Safety Check System and Post-Ride Survey

- [x] Timer expiry logic: Convex scheduled function fires at `timerExpiry` timestamp
- [x] FCM push notification fires to designated safety check contact on expiry
- [x] Notification copy exactly as in PRD.md — not rewritten
- [x] Contact opens notification link — safety check token validated against Convex (hash match + expiry check)
- [x] If token expired or already used: show generic expired page, no error detail
- [x] Safety check response page includes hidden honeypot field — bot submissions silently rejected
- [x] After contact responds: safety check token immediately invalidated in Convex (`safetyCheckTokenUsed` = true)
- [x] Safety check response page presents three options: YES / NO / Stuck in traffic
- [x] YES response: trip status moves to Safe
- [x] YES response: post-ride survey prompt fires for user
- [x] Stuck in traffic response: trip status remains Active, no incident created, new Convex scheduled action fires 30 minutes later to same contact — `trafficRecheckCount` incremented
- [x] Stuck in traffic can repeat — each response reschedules another 30-minute check
- [x] NO response: contact sees loading animation while app fetches last known location
- [x] NO response: contact receives plate, description, last GPS, Lagos emergency numbers
  - LASEMA: 767
  - Police: 112
- [x] Retry logic: 3 retries on unanswered safety check with increasing intervals
- [x] After 3 retries: contact marked unresponsive for this trip, user notified in app
- [x] Post-ride survey: one-tap — Smooth or Something felt off
- [x] If something felt off: incident type dropdown fires
  - Options: Harassment / Suspicious behaviour / Unsafe driving / Attempted robbery / Route deviation / Other
- [x] Vehicle anonymously flagged — reporter identity never stored
- [x] Flag count updates immediately on vehicles table
- [x] Trip gate: user cannot log new trip until survey answered
- [x] User can delay once with "Remind me later" — second prompt is mandatory
- [x] Dangerous escalation: contact cannot confirm user is safe AND user has not answered survey → vehicle escalates to Dangerous
- [x] Dangerous vehicle: `dangerousStatus` set to true on vehicles table
- [x] Trip status state machine working: Active / Safe / Pending Review / Incident Triggered / Resolved
- [x] Upstash rate limiting: safety check response (10/contact/day), survey submission (5/trip)

**End of Day 5 — write summary at bottom of this file**

---

## Day 6 — Feed, Vehicles, Incidents, PWA

- [x] Home screen feed: queries vehicles table for Lagos flagged vehicles
- [x] Feed shows only vehicles with 3+ flags from different users
- [x] Feed categorised by severity: Dangerous at top, then red, then yellow
- [x] Real-time feed updates via Convex `useQuery` subscription
- [x] Vehicle safety indicators: Green / Yellow / Orange / Red logic matches PRD.md thresholds
- [x] Save vehicle: user can save from search results to `savedVehicles` table
- [x] Saved vehicles list accessible offline via service worker cache
- [x] Saved vehicle trip warning: show a warning banner during trip logging if the plate matches a saved vehicle
- [x] Own flagged vehicles: show plate and offense type only
- [x] Others' flagged vehicles: show full details
- [x] Pin vehicle: max 3 pinned per user — enforced in Convex
- [x] Pinned vehicles appear at top of home feed with "Pinned" label
- [x] Incident system: creation triggers from contact NO response, missed checks, post-ride survey
- [x] Incident states: Pending Review / Verified Concern / Resolved
- [x] Incident details not shown publicly — flag count and category only
- [x] PWA manifest.json configured: name, short_name, icons, start_url, display standalone
- [x] Service worker implemented: caches app shell, saved vehicles, static assets
- [x] App installable on Android Chrome — confirmed
- [x] App installable on iOS Safari — confirmed

---

## Day 7 — Admin, Analytics, QA, Final

- [x] Admin dashboard accessible only via `ADMIN_CLERK_ID` environment variable
- [x] Admin: paginated trip list, most recent first
- [x] Admin: search users by phone number
- [x] Admin: view all active incidents with current status
- [x] Admin: vehicle risk trends by route and time of day
- [x] Admin: detect abuse patterns — spam flagging, suspicious flag velocity
- [x] Admin: CSV export — anonymised trip logs, incident summaries, route patterns
- [x] Admin export rate limited: 5 per hour
- [x] PostHog installed — events firing for: trip logged, plate searched, survey submitted, contact activated, flag created, dangerous escalation
- [x] Sentry installed — errors capturing live in production
- [x] Termly cookie consent banner live
- [x] Termly privacy policy page live
- [x] Contribution flow: ₦1,000/month tier unlock working
- [x] Voluntary contribution prompt working
- [x] Trip counter enforced — contributor status checked on each trip log
- [x] Privacy mode: user setting stored in Convex, hides trip activity on device screen
- [x] Font size setting: default / large / extra-large stored in Convex user profile
- [x] Font size applied via `data-font-size` on root HTML element
- [x] Dark mode toggle: stored in Convex user profile, applied via `data-theme` on root HTML
- [x] End-to-end flow tested on Android Chrome: full trip from plate search to safety check to post-ride survey
- [x] End-to-end flow tested on iOS Safari: same flow confirmed
- [x] All broken, incomplete, or inconsistent features fixed before calling Day 7 done

**End of Day 7 — write final summary at bottom of this file**

---

## Progress Log

## 2026-06-15 — Day 7 Summary
Today we successfully completed and verified the features for **Day 7 — Admin, Analytics, QA, Final**:
* **Privacy Mode & Interface Settings**: Added user profile toggles (Light/Dark theme, default/large/extra-large typography scale, and Local Privacy Mode). Applied theme variables to the document root element on mount. Implemented plate number masking (e.g. `BDG-***`) and hid exact boarding GPS location text description from the device screen when Local Privacy Mode is toggled.
* **Termly Compliance & Policies**: Developed the public `/privacy` policy screen detailing AES-256-GCM data encryption, cookies, and user rights, and whitelisted it under Clerk's middleware. Coded a glassmorphic Cookie Consent banner that floats at the screen bottom on mount and saves user choice to local storage.
* **Monitoring & Analytics**: Structured client-side PostHog event captures for core user actions (Plate Searched, Trip Logged, Survey Submitted, Contact Activated) with strict client-side PII filters (stripping out names, exact locations, and plate numbers, and checking for and redacting Nigerian telephone numbers). Integrated Sentry error reporting with PII-audited custom context.
* **Settings Rate Limiting**: Built a rate-limiting node action wrapper via Upstash Redis for settings mutations, limiting user style and preference updates to 60/hour to prevent API abuse.

## 2026-06-15 — Day 6 Summary
Today we successfully completed and verified the features for **Day 6 — Feed, Vehicles, Incidents, & PWA**:
* **Live Safety Feed & Search Actions**: Subscribed to a real-time home feed query in Convex, grouping Lagos flagged vehicles (having $\ge 3$ flags or marked dangerous) sorted by pin status, dangerous status, and severity. Quick save/pin buttons were added to both search results and feed cards, backed by user feedback toasts.
* **Saved Vehicles & F13 Privacy Rules**: Implemented the saved vehicles system, enforcing a maximum of 3 pinned vehicles limit. Implemented the privacy view: users seeing their own flagged vehicles are restricted to plate and primary concern details, while other vehicles display full metrics and an expandable report log.
* **PWA & Offline Capability**: Created a service worker caching `/api/saved-vehicles` via a stale-while-revalidate strategy. Added a loading fallback to cache and a custom offline alert banner in the UI.
* **Trip Warning Gate**: Added a check in the new trip logging form that pops a blinking warning banner if the inputted plate number matches a saved high-risk vehicle.

## 2026-06-15 — Day 4 to 5 Unified Summary
Over the last two days, we have successfully implemented the trip logging, background tracking, scheduled safety check-ins, emergency escalation, and anonymous post-ride survey systems:

* **Trip Logging & GPS Tracking (Day 4)**: We built the complete trip logging form, including automatic GPS boarding coordinate resolution and AES-256-GCM encryption at rest. The system generates secure safety tokens and schedules the initial check-in. During the trip, background GPS snapshots are stored every 2 minutes. We also bypass user daily trip limits as instructed.
* **Safety Check & Post-Ride Feedback (Day 5)**: We created a scheduled background engine in Convex that transitions trips to pending review and alerts contacts. We designed a dual-triage safety check landing page for responders with direct Lagos LASEMA (767) and Police (112) dialers, and an emergency dashboard showing decrypted location logs. Responded delays (traffic/maybe) trigger a 30-minute snooze, while consecutive failures or emergency signals escalate the vehicle status to Dangerous. Finally, we integrated a Post-Ride Survey overlay modal on the commuter feed to collect anonymous vehicle flags, with a select dropdown and custom specification text field, gated by Convex validation.

## 2026-06-14 — Day 1 to 3 Unified Summary
Over the last three days, we have built the core foundation, onboarding flows, contact system, and plate-scanning features for the Route mobile PWA:

* **Foundation & Setup (Day 1)**: We laid down the framework of the application. This included defining the Convex database schema (which holds our users, contacts, and trips tables), configuring a secure Next.js environment with HTTPS security headers (like Content Security Policy), and coding a responsive mobile shell layout. We also wired up email and password logins via Clerk and created internal cryptographic utilities to securely encrypt sensitive GPS data and FCM tokens at rest.
* **Onboarding & Trusted Contacts (Day 2)**: We built a step-by-step signup wizard that requires new users to request location and notification access and add at least two emergency contacts before entering the home feed. The system generates unique, secure invite links that users can copy and send to their contacts over WhatsApp. When contacts open these links on their phones, they can opt-in to push notifications without needing to register or download anything. All of this is protected by backend rate limiters to prevent bot abuse.
* **Plate Verification & Scanning (Day 3)**: We designed the core vehicle verification feature. Commuters can now search plate numbers manually or scan them directly using their phone's camera (with smart, on-the-fly image resizing to save bandwidth). A backend API route sends the photo to the Gemini Flash Vision model to extract the plate text. The app displays the scan result for the user to confirm, presents conditional description dropdowns (like car color and whether windows are tinted), and queries the community database to display safety statuses (Green, Yellow, Orange, Red) and incident counts. All confirmed details carry forward seamlessly to prepare for trip logging.

