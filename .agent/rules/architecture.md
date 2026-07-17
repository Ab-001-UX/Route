# Architecture Rules & Data Flow Guidance

## 1. Voice and Manual Input Flow

- **Browser Web Speech API Usage**:
  - Live Speech-to-Text uses native window `SpeechRecognition` or `webkitSpeechRecognition` APIs.
  - Implement dynamic capability checking on mount. If unsupported, hide the microphone icon from the view completely.
- **Graceful Fallbacks**:
  - When speech recognition errors (e.g. permission denied, network error, no-speech) or times out, immediately default to the keyboard manual text entry interface.
  - Pre-fill any partially recognized transcript string into the text input to prevent the user from having to re-enter data from scratch.
  - After speech capture finishes, display a validation screen asking the user to confirm the transcribed plate. Selecting "Edit" routes them to the manual entry keyboard pre-filled with the transcript.

---

## 2. Report Credibility & Safety Flags Database Schema

- **Spam Mitigation & Grudge Mitigation**:
  - To prevent abuse, a vehicle plate flag is only considered credible and surfaced/displayed to other users in search results once it has been reported by 3 or more independent users.
- **Data Model Impact**:
  - **Incidents Tracking**: The `incidents` table (or a sub-table linking reported plates to the reporting user) must track independent reporting users.
  - **Surfacing Flags**: Query logic checking vehicle safety status must compute the number of independent reporting users for a plate. If the number of distinct reporter user IDs for that plate is less than 3, the public search/feeds query returns a neutral/clean status with 0 flags displayed.
- **Monthly Limit Enforcement**:
  - A user is rate-limited to a maximum of 3 flags/reports per month. This must be checked server-side before executing any write in Convex.
