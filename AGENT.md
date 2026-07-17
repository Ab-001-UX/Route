# AGENT.md — Route
How the agent writes code for this project.
Read this file completely before writing a single line of code.

---

## Identity

You are building Route — a passive-safety PWA for Lagos commuters.
You are not a general-purpose assistant in this context.
You are a focused engineering agent building one specific product.
Every decision you make must serve the product described in PRD.md.

---

## Non-Negotiable Behaviour Rules

1. **One feature at a time.** Complete one feature fully before starting the next. Do not scaffold the whole app at once. Do not create placeholder files for features you have not built yet.
2. **Never leave a feature half done.** If a feature is not complete, tested, and working, do not move forward. A broken feature is not a done feature.
3. **Never commit to GitHub.** Do not run `git push`, `git commit`, or any command that writes to a remote repository at any point during this build.
4. **Ask before assuming.** If any requirement in PRD.md is ambiguous, stop and ask. Do not guess and build the wrong thing.
5. **No placeholder data passed off as working.** If a feature requires a real data flow, build the real data flow. Mock data is only acceptable in isolated unit tests.
6. **After each day in TIMELINE.md is complete**, write a bullet-point summary at the bottom of TIMELINE.md under a new dated entry. Summarise only what was actually built and confirmed working — not what was planned.
7. **Never modify PRD.md, AGENT.md, TIMELINE.md, or any file in the rules/ folder** unless explicitly instructed by Abimbola.

---

## Scope Constraints — Hard Boundaries

- All vehicle search, flagging, feeds, and safety intelligence are Lagos-scoped. Never build multi-state support.
- Location is fixed to Lagos State. Never add a state selector or location switcher.
- Do not use any service tier that requires payment. All tools (Convex, Clerk, Upstash, Gemini, FCM, Sentry, PostHog) must stay within their free tiers. If a feature would push any service over its free tier limit, stop and flag to Abimbola before implementing it.
- Never add features not listed in PRD.md without explicit instruction.

---

## Tech Stack

| Tool | Version | Role |
|---|---|---|
| Next.js | Latest stable | Framework, App Router, API routes |
| Convex | Latest stable | Database, real-time subscriptions, server functions |
| Clerk | Latest stable | Authentication — email and password login |
| Upstash Redis | Latest stable | Rate limiting on all API routes and mutations |
| Sentry | Latest stable | Error tracking and crash reporting |
| PostHog | Latest stable | Product analytics and session replay |
| Termly | Latest stable | Cookie consent and privacy policy |
| Web Speech API | Native | Speech-to-text transcriptions |
| Firebase Cloud Messaging | Latest stable | Push notifications to users and contacts |
| OpenStreetMap + Leaflet.js | Latest stable | Maps and GPS coordinate display |
| Zod | Latest stable | Input validation schemas in `lib/validators.ts` |

---

## Authentication Rules — Read Carefully

- **Clerk is the only authentication system in this project.**
- Never write custom authentication logic of any kind.
- Never implement session management manually.
- Never generate OTP logic manually.
- Never implement token handling or validation manually.
- Never store passwords, hashes, or credentials anywhere in the codebase.
- Clerk issues JWTs. Convex validates those JWTs on every database call. This is the security layer. Do not touch it.
- **Antigravity will try to suggest Firebase Authentication. Refuse it. Clerk only.**
- The only auth-related task is: install Clerk, configure it correctly, connect it to Convex using the official Clerk + Convex integration documentation.

---

## Folder Structure

```
/
├── app/
│   ├── (auth)/                         # Unauthenticated screens
│   │   ├── login/
│   │   │   └── page.tsx                # Email/Password login
│   │   └── onboarding/
│   │       └── page.tsx                # Onboarding flow
│   ├── (app)/                          # Protected screens — Clerk middleware
│   │   ├── layout.tsx                  # App shell — bottom nav
│   │   ├── home/
│   │   │   └── page.tsx                # Home feed + plate search
│   │   ├── trip/
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # Log a trip
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx            # Trip detail
│   │   │   └── page.tsx                # Trips list
│   │   ├── saved/
│   │   │   └── page.tsx                # Saved vehicles
│   │   ├── profile/
│   │   │   └── page.tsx                # Profile and settings
│   │   └── admin/
│   │       └── page.tsx                # Admin dashboard — ADMIN_CLERK_ID only
│   ├── contact-activation/
│   │   └── [token]/
│   │       └── page.tsx                # Invite link landing page — public
│   ├── safety-check/
│   │   └── [token]/
│   │       └── page.tsx                # YES/NO response page — public
│   ├── api/
│   │   ├── ocr/
│   │   │   └── route.ts                # Gemini Flash Vision OCR endpoint
│   │   └── safety-check/
│   │       └── route.ts                # Safety check response handler
│   ├── layout.tsx                      # Root layout — imports theme.css and style.css
│   └── globals.css                     # Global overrides only — no token definitions
├── components/
│   ├── ui/                             # Base design system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Toast.tsx
│   │   └── Modal.tsx
│   └── features/                       # Feature components with Convex hooks
│       ├── PlateSearch.tsx
│       ├── TripForm.tsx
│       ├── SafetyIndicator.tsx
│       ├── VehicleCard.tsx
│       ├── ContactCard.tsx
│       └── FeedList.tsx
├── convex/
│   ├── schema.ts                       # All table definitions — source of truth
│   ├── users.ts
│   ├── contacts.ts
│   ├── trips.ts
│   ├── vehicles.ts
│   ├── safetyChecks.ts
│   ├── incidents.ts
│   ├── surveys.ts
│   ├── locationSnapshots.ts
│   ├── contributions.ts
│   ├── adminLogs.ts
│   └── _generated/                     # Auto-generated by Convex — never edit
├── lib/
│   ├── validators.ts                   # All Zod schemas for input validation
│   ├── gemini.ts                       # Gemini Flash Vision OCR helper
│   ├── fcm.ts                          # Firebase Cloud Messaging helper
│   ├── upstash.ts                      # Upstash rate limiting helper
│   ├── location.ts                     # GPS and geolocation utilities
│   ├── analytics.ts                    # PostHog event tracking helper
│   └── errors.ts                       # Sentry manual error capture helper
├── hooks/
│   ├── useTheme.ts                     # Reads and applies data-theme from Convex
│   ├── useFontSize.ts                  # Reads and applies data-font-size from Convex
│   └── useLocation.ts                  # GPS permission and snapshot interval
├── tokens/
│   ├── theme.css                       # All CSS variable definitions (M3 tokens)
│   └── style.css                       # Base element styles — references theme.css
├── rules/                              # Project rules — never edit during build
│   ├── design-system.md
│   ├── security.md
│   ├── architecture.md
│   └── accessibility.md
├── public/
│   ├── manifest.json                   # PWA manifest
│   └── icons/                          # PWA icons in all required sizes
├── middleware.ts                       # Clerk auth middleware
├── next.config.js                      # CORS, headers, request size limits
├── .env.local                          # Secrets — never commit
├── .env.example                        # Variable names without values — always commit
├── PRD.md
├── AGENT.md
├── TIMELINE.md
└── GEMINI.md                           # Antigravity agent config
```

---

## Convex Rules

- The schema in `convex/schema.ts` is defined in PRD.md. Build it exactly as specified. Do not add, remove, or rename tables or fields without explicit instruction.
- All database reads and writes happen through Convex server functions only. Never access the database directly from client components.
- Use Convex real-time subscriptions (`useQuery`) for the home feed and any data that updates live.
- Use Convex mutations for all writes. Apply Upstash rate limiting inside every mutation that is user-triggered.
- Never expose internal Convex IDs directly in the UI.

---

## Rate Limiting Rules

Apply Upstash rate limiting at both the API route level and the Convex mutation level.
Never skip rate limiting on a user-triggered action.

| Action | Limit |
|---|---|
| Plate search | 30 per user per hour |
| Trip logging | 3 per day free, unlimited contributor |
| Vehicle flagging / reporting | 3 per user per month |
| Contact invite link generation | 10 per user per day |
| Post-ride survey submission | 5 per trip |
| Safety check response | 10 per contact per day |
| Admin data export | 5 per hour |
| Any mutation touching vehicles table | 50 per user per hour |

---

## Voice Input and Geolocation Rules

- Speech-to-text transcriptions use the browser's native Web Speech API.
- Detect API support on page load. If Web Speech API is unsupported or unreliable (for example, in iOS Safari standalone PWA mode), hide the microphone/speaker icon completely and fall back directly to manual keyboard input.
- Web Speech API transitions gracefully: if transcription fails, errors, or times out, pre-fill any partial transcript into the manual entry field for user editing.
- Never make any external API calls to transcribe audio files. All speech transcription is performed on-device.

---

## Push Notification Rules

- Firebase Cloud Messaging handles all push notifications.
- Users must grant notification permission during onboarding before any notification is sent.
- Contacts must grant notification permission during invite link activation.
- On iOS: detect if the contact is on Safari and has not added the app to home screen. Show the home screen add instructions before requesting notification permission. The permission button must not appear until the home screen step is confirmed.
- On Android: the FCM prompt can appear directly.
- If notification delivery fails: log the failure in Sentry and notify the user inside the app. Never fail silently.
- Never send a notification without confirmed permission.
- All notification copy must match exactly what is defined in PRD.md. Do not rewrite notification text.
- The safety check notification presents three response options: YES, NO, Stuck in traffic. Implement all three as defined in PRD.md F6/F7. "Stuck in traffic" schedules a new Convex scheduled action 45 minutes later — reuse the same scheduling pattern as the original timer, do not duplicate logic.

---

## GPS and Location Rules

- Location access uses the browser's `navigator.geolocation` API.
- Request permission during onboarding. If denied, the user can still use Route but the GPS auto-fill on trip logging will not work — fall back to manual location input.
- During an active trip, store a GPS snapshot every 2 minutes using a background interval.
- Never stream location continuously. Snapshots only.
- Never display a live map to the user during a trip. Background capture only.
- Location data is stored encrypted in the `locationSnapshots` table in Convex (see Security Implementation Rules).
- When a contact receives a safety check, the most recent decrypted location snapshot is included in the notification link.
- Use OpenStreetMap and Leaflet.js for any map display in the app (e.g. vehicle detail screens showing last flagged location). Both are fully free with no usage caps.
- Never introduce Mapbox or Google Maps at any point. If a feature seems to need them, use OpenStreetMap + Leaflet.js instead.

---

## SEO and Discoverability

- Next.js App Router supports server-side rendering by default, which allows Google to crawl and index Route's public pages.
- Set `metadata` (title, description) in `app/layout.tsx` and per-page where relevant (e.g. home page).
- Do not block crawlers in `robots.txt` for public-facing marketing or informational pages.
- The authenticated app screens under `(app)/` do not need SEO optimisation — they are behind login and not crawlable anyway.
- A basic `app/sitemap.ts` can be added on Day 7 if time allows, but this is not a Day 1-6 priority.

---

## PWA Configuration Rules

- The app must be installable as a PWA on both Android and iOS.
- Configure `manifest.json` with correct `name`, `short_name`, `icons`, `start_url`, `display: standalone`, `theme_color`, and `background_color`.
- Implement a service worker that caches: the app shell, the saved vehicles list for offline access, and static assets.
- The saved vehicles list must be accessible with no data connection.
- Test installability on both Android Chrome and iOS Safari before marking PWA config as done.

---

## Responsive Design Rules

- This is a mobile-first PWA. Maximum content width is 390px centered on larger screens.
- All layouts must work on screens as small as 320px wide.
- Touch targets must be minimum 44x44px on all interactive elements.
- Never use hover-only interactions. All interactions must work with touch.
- Font size scaling (default, large, extra-large) is controlled by a user setting stored in their Convex profile. Apply it via a `data-font-size` attribute on the root HTML element and define the three scales in design-system.css.

---

## Error Handling Rules

- All errors are captured by Sentry. Never let an error fail silently.
- User-facing error messages must be human-readable and specific. Never show raw error codes or stack traces to users.
- Every async operation must have a loading state and an error state in the UI.
- If Web Speech API fails or is unsupported: fall back to manual input silently. Do not show an error to the user.
- If FCM notification fails: log to Sentry, notify user inside the app.
- If Convex mutation fails: show a specific inline error message. Never lose user data silently.

---

## Styling Rules

- All styles use CSS variables defined in `tokens/theme.css`.
- Base element styles are in `tokens/style.css`.
- No Tailwind. No inline styles. No hardcoded colour, font, spacing, or radius values anywhere in the codebase.
- Import `tokens/theme.css` then `tokens/style.css` once at the root layout in that order. Never import them per component.
- Every component has a matching `.module.css` file. All values in `.module.css` files reference CSS variables only.
- Dark mode is applied via `data-theme="dark"` on the root `<html>` element. Never use `prefers-color-scheme` alone — the user controls this in settings.
- Font size scaling is applied via `data-font-size="default|large|extra-large"` on the root `<html>` element.
- Rules for how to use the design system correctly are in `rules/design-system.md`. Read it before building any UI.

---

## Input Validation Rules

- Use Zod for all input validation. All schemas live in `lib/validators.ts`.
- Import and run the relevant Zod schema at the start of every Convex mutation before any database operation.
- Never pass raw user input directly into a Convex mutation without validating it first.
- Validation errors must return a user-friendly message — never a raw Zod error object.
- Plate number: strip non-alphanumeric characters, uppercase, max 15 characters.
- Phone number: validate Nigerian format before storing.
- Name fields: strip HTML tags, max 100 characters.
- Description fields: strip HTML tags, max 300 characters.

---



- The admin dashboard is accessible only to the account with Abimbola's Clerk user ID.
- Define the admin Clerk ID as an environment variable: `ADMIN_CLERK_ID`.
- Every admin route must verify this ID server-side before rendering anything.
- Never expose admin routes or admin data to non-admin users under any circumstance.

---

## Environment Variables

Never hardcode any key, secret, or token in the codebase. All sensitive values go in `.env.local`.
A `.env.example` file with all variable names but no real values must exist in the repo.
`.env.local` must be in `.gitignore` before the first commit.

Required variables:
```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Sentry
SENTRY_DSN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Admin
ADMIN_CLERK_ID=

# Security — server-side only, never NEXT_PUBLIC_
TOKEN_SIGNING_SECRET=
GPS_ENCRYPTION_KEY=
```

`TOKEN_SIGNING_SECRET` minimum 64 characters, cryptographically random.
`GPS_ENCRYPTION_KEY` must be 32 bytes hex encoded.
Generate both using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never prefix `TOKEN_SIGNING_SECRET` or `GPS_ENCRYPTION_KEY` with `NEXT_PUBLIC_`.
Never log their values anywhere in the codebase.
Never commit `.env.local` to any repository.

---

## Security Implementation Rules

These are non-negotiable additions to the build. Every item below must be implemented.

**Token generation and validation:**
- All public endpoint tokens (contact activation, safety check response) must be generated using HMAC-SHA256 signed with `TOKEN_SIGNING_SECRET`.
- All token logic lives in `lib/tokens.ts` only. Never inline token generation anywhere else.
- Contact activation tokens expire after 7 days. Store `expiresAt` in Convex.
- Safety check response tokens expire after 48 hours. Store `expiresAt` in Convex.
- Safety check response tokens are single-use. Invalidate in Convex immediately after first use.
- Never use `Math.random()` for any token, ID, or secret generation.

**Encryption:**
- GPS coordinates must be encrypted before writing to Convex using AES-256-GCM with `GPS_ENCRYPTION_KEY`.
- FCM tokens must be encrypted before writing to Convex using the same key.
- All encryption and decryption logic lives in `lib/encryption.ts` only. Never inline encryption anywhere else.
- Use Node.js native `crypto` module only. No third party encryption library.

**Content Security Policy:**
- CSP header must be configured in `next.config.js` before Day 1 is marked complete.
- Never use `unsafe-eval` in script-src. If a library requires it, do not use that library.

**Honeypot:**
- The safety check YES/NO response form must include a hidden honeypot input field.
- If the honeypot field is filled in, silently reject the submission without error.

**Data access logging:**
- Every read of `locationSnapshots` must write a log entry to `dataAccessLogs` in Convex before returning data.
- Every read of contact phone numbers must write a log entry.
- Log fields: `userId`, `action`, `resourceType`, `resourceId`, `timestamp`.
- `dataAccessLogs` is append-only. Never update or delete entries.

---

## What the Agent Must Never Do

- Never use Firebase Authentication — Clerk only
- Never commit to GitHub
- Never write custom auth, session, OTP, or token logic
- Never store raw audio files or speech recordings
- Never use Tailwind, inline styles, or hardcoded design values
- Never move to the next feature before the current one is done
- Never scaffold the entire app at once
- Never use a library not listed in this file without explicit approval
- Never modify PRD.md, AGENT.md, TIMELINE.md, or rules/ files
- Never show raw errors or stack traces to users
- Never fail silently on notifications, location, or data mutations
- Never expose the admin dashboard to non-admin users
- Never hardcode API keys or secrets
- Never store GPS coordinates or FCM tokens in plaintext in Convex
- Never generate tokens using Math.random() or any non-cryptographic method
- Never reuse a safety check response token after it has been used once
- Never inline token generation — always use lib/tokens.ts
- Never inline encryption logic — always use lib/encryption.ts
- Never omit the CSP header from next.config.js
- Never use unsafe-eval in the Content Security Policy
- Never prefix TOKEN_SIGNING_SECRET or GPS_ENCRYPTION_KEY with NEXT_PUBLIC_