---
trigger: always_on
---

security.md — Route
Security rules and universal protections for this project.
The agent must read this file at the start of every session and treat it as
an active audit checklist. If any rule below is being violated anywhere in
the codebase, stop and fix it before continuing.

---

## SECTION 1 — UNIVERSAL PROTECTIONS
These apply to every part of Route without exception.

---

### 1A — Authentication

- Clerk is the only authentication system. Never write custom auth logic.
- Never store passwords, hashes, tokens, or credentials in Convex, localStorage, sessionStorage, or anywhere in the codebase.
- Clerk JWTs are validated by Convex on every function call. Never bypass this.
- Never store authentication tokens in localStorage or sessionStorage under any circumstance. Clerk manages token storage internally via HTTP-only cookies.
- All protected routes are gated by Clerk middleware in `middleware.ts`. Never leave a protected route unguarded.
- Phone numbers collected during onboarding are stored in Convex only. Never logged, never exposed in API responses beyond the authenticated user's own session.

---

### 1B — Input Validation and Sanitisation

- Validate all user inputs server-side in Convex mutations before any database write.
- Never trust client-side validation alone.
- Never pass raw request data directly into Convex mutations without validating shape, type, and length first.
- Use Zod for all input validation schemas. Define schemas in `lib/validators.ts` and import them into Convex mutations.
- Plate number input: strip all characters except alphanumeric and spaces, uppercase, max 15 characters.
- Phone number input: validate Nigerian phone number format before storing.
- Name fields: strip HTML tags, max 100 characters.
- Description fields: strip HTML tags, max 300 characters.
- Never log raw user inputs anywhere. Sanitise before logging.
- Strip all carriage return and newline characters (`\r\n`, `\n`) from any logged variables to prevent log injection.

---

### 1C — CORS and HTTP Security Headers

- Configure CORS in `next.config.js` to allow only the Route production domain. Never use wildcard `*` origins on authenticated endpoints.
- Enforce these headers on every response via `next.config.js`:
  - `X-Frame-Options: DENY` — clickjacking protection
  - `X-Content-Type-Options: nosniff` — MIME sniffing defence
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains` — force HTTPS
  - `X-Powered-By` header must be disabled — never advertise the tech stack
  - `Content-Security-Policy` — defined below. Never omit this header.
- Apply these headers globally. No route is exempt.

**Content Security Policy — copy exactly:**
```
default-src 'self';
script-src 'self';
connect-src 'self' https://*.convex.cloud https://fcm.googleapis.com;
img-src 'self' data: blob:;
style-src 'self' 'unsafe-inline';
font-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self'
```

Never use `unsafe-eval` in script-src under any circumstance.
If a library requires `unsafe-eval`, do not use that library — find an alternative and flag to Abimbola.

---

### 1D — Rate Limiting

- Upstash rate limiting is applied on every user-triggered API route and Convex mutation.
- Auth endpoints are additionally rate limited to 10 attempts per IP per 15 minutes.
- Global API rate limit: 300 requests per IP per minute across all routes.
- After 5 consecutive failed OTP attempts for the same phone number, temporarily lock that account.
- Rate limits defined in AGENT.md apply in addition to the above. Never remove or relax them.
- Rate limit exceeded responses must return HTTP 429 with a user-friendly message. Never a raw error.
- All rate limiting logic lives in `lib/upstash.ts`. Never inline rate limiting logic in components or mutations.

---

### 1E — Dependency and Supply Chain Security

- Run `npm audit` before every production deployment. Do not deploy if high-severity vulnerabilities are found.
- Pin dependency versions in `package.json`. Do not use wildcard ranges (`^`, `~`) for security-critical packages including Clerk, Convex, and Upstash.
- Never commit `node_modules` to version control.
- Never install packages with fewer than 500 weekly downloads or not updated in over 12 months without flagging to Abimbola first.
- A `.env.example` file must exist in the repo with all required variable names but no real values.
- `.env`, `.env.local`, and `.env.production` are in `.gitignore` before the first commit. Verify this before pushing any code.

---

### 1F — Environment Variables and Secrets

- All API keys, secrets, and tokens live in `.env.local` only. Never hardcode them.
- Never log environment variable values anywhere in the codebase.
- Server-side environment variables (without `NEXT_PUBLIC_` prefix) are never accessible client-side.
- The Gemini API key, Clerk secret key, Convex deploy key, and Upstash tokens are server-side only.
- Rotate all secrets immediately if the repository is ever accidentally made public or a secret is exposed in logs.

---

### 1G — Error Handling and Information Disclosure

- Never expose raw error messages, stack traces, database errors, or internal file paths to API consumers in production.
- Use a global error handler that returns a generic message to the client while logging the full error to Sentry server-side.
- Disable `X-Powered-By` header — already covered in 1C.
- All user-facing error messages must be human-readable, specific to the action that failed, and never contain internal details.
- Every async operation must have a loading state and an error state in the UI. Never fail silently.

---

## SECTION 2 — ROUTE-SPECIFIC PROTECTIONS
These apply to specific features in Route.

---

### 2A — User Accounts and IDOR Protection

Route handles private user records: trips, contacts, location snapshots, safety checks, surveys.

- Always verify that the requesting user owns the requested resource before reading, updating, or deleting any Convex document.
- Use Clerk user ID for ownership verification on every Convex query and mutation that accesses user-scoped data.
- Never expose one user's trips, contacts, or location data to another user under any circumstance.
- Use Convex's built-in document IDs (not sequential integers) for all resource references. Never expose sequential IDs in URLs.
- The contact activation link uses a unique cryptographic token. That token is stored hashed in Convex. Never in plaintext.
- A contact activation token can only activate one contact record. Once activated it cannot be reused.
- The safety check response link is scoped to a specific trip and contact. Verify both before processing any response.

---

### 2B — Voice and Input Sanitization Security

- No photos, camera captures, image uploads, or media files of any kind are processed, captured, or transmitted.
- Speech-to-text transcription uses the browser-native Web Speech API. All audio is transcribed locally on-device. Audio tracks or files are never recorded, cached, stored, or sent to external servers or APIs.
- Sanitization: All strings returned by voice transcripts or entered manually must be sanitized server-side. Strip HTML tags, remove carriage returns, and restrict to alphanumeric characters, spaces, and dashes before storing in Convex.

---

### 2C — Public API Endpoints

Route has two public-facing endpoints that do not require Clerk authentication:
- `/contact-activation/[token]` — invite link landing page
- `app/api/safety-check/[token]` — contact YES/NO response

**Token generation:**
- All tokens must be cryptographically signed using HMAC-SHA256 with a server-side secret key stored in `TOKEN_SIGNING_SECRET` environment variable.
- Never generate tokens using `Math.random()` or any non-cryptographic method.
- Use Node.js native `crypto.createHmac('sha256', process.env.TOKEN_SIGNING_SECRET)` for all token generation.
- Token generation logic lives in `lib/tokens.ts` only. Never inline token logic.

**Token expiry:**
- Contact activation tokens expire after 7 days. Store `expiresAt` timestamp in Convex alongside the token hash.
- Safety check response tokens expire after 48 hours.
- On every token validation: check the hash matches AND `expiresAt` is in the future. Reject expired tokens with a generic 404.

**Token usage:**
- Safety check response tokens are single-use. Invalidate immediately in Convex after first use.
- Contact activation tokens can be reused for resending but only activate one contact record.

**Both endpoints must be protected as follows:**
- Validate token hash and expiry against Convex before doing anything else.
- Return a generic 404 if the token is invalid, expired, or not found. Never reveal which condition failed.
- Apply Upstash rate limiting: 10 requests per IP per minute.
- Safety check response endpoint verifies: token valid and unexpired, token matches the correct trip, trip is still in Active or Pending status, contact has not already responded.
- Add a honeypot hidden field to the safety check response form. If it is filled in, silently reject the submission — it is a bot.
- Request body size limit: 50KB maximum. Enforce in `next.config.js`.
- Return HTTP 401 for unauthorised access to protected routes. Never return 404 for auth failures on protected routes.
- All API responses follow this envelope:
  ```
  { "success": true, "data": {} }
  { "success": false, "message": "Human-readable error" }
  ```

---

### 2D — Admin Panel Security

Route has an admin dashboard accessible only to Abimbola.

- Admin access is controlled by `ADMIN_CLERK_ID` environment variable verified server-side on every request.
- Every admin route must verify the Clerk user ID server-side before rendering anything. Never rely on client-side checks alone.
- Never expose admin routes or admin data to non-admin users under any circumstance.
- Log every admin action with: Clerk user ID, action type, timestamp. Store in a dedicated Convex `adminLogs` table.
- The admin CSV export must anonymise all user-identifiable fields before export. No Clerk IDs, phone numbers, or names in exported data.
- Admin accounts are not creatable through the standard registration flow. Access is controlled entirely by the environment variable.

---

### 2E — Data Privacy

- All incident reports and vehicle flags are anonymous. The reporter's Clerk user ID is never stored alongside a flag or incident record. Store only the flag count and incident type.
- **GPS coordinates must be encrypted at rest before writing to Convex.** Use Node.js native `crypto` module (AES-256-GCM) with a server-side key stored in `GPS_ENCRYPTION_KEY` environment variable. Decrypt only when serving to the authenticated user or the specific contact via their valid token. Encryption and decryption logic lives in `lib/encryption.ts` only.
- **FCM tokens must be encrypted at rest** using the same `GPS_ENCRYPTION_KEY`. Decrypt only when firing a notification. Never store FCM tokens in plaintext in Convex.
- Contact phone numbers and email addresses are never exposed to other users.
- Never log personal data (phone numbers, names, GPS coordinates) to Sentry or PostHog. Use anonymised identifiers only.
- PostHog events must only contain anonymised event names and non-identifying properties. Never include user PII in any analytics event.

### 2F — Sensitive Data Access Logging

Route stores GPS location data which is high-risk if accessed improperly.

- Create a `dataAccessLogs` table in Convex with fields: `userId`, `action`, `resourceType`, `resourceId`, `timestamp`.
- Every read of `locationSnapshots` must write a log entry before returning data.
- Every read of contact phone n