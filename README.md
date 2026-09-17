# MediKiosk — Base Architecture

A React (Vite) + Tailwind CSS starting point for a hospital front-desk clinical
intake kiosk. This is **base/scaffold code** — the core state model, layout,
and the components called out in the brief are fully built; everything else
is stubbed with clear placeholders so you can keep building.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## What's implemented

- **`src/context/KioskContext.jsx`** — Context API wrapping the full data
  model (`patient`, `intake`, `aiSummary`). Exposes:
  - `updateIntake(dottedKey, value)` — e.g. `updateIntake('hpi.site', 'Left knee')`
  - `addSymptomTag(symptom)` — appends a tapped symptom to `chiefComplaint`
  - `confirmSummary()` — flips `aiSummary.status` to `'confirmed'`
  - Automatic **red flag detection**: a keyword rule table
    (`RED_FLAG_RULES`) scans the chief complaint / HPI text on every update
    (e.g. "chest pain" → cardiac flag, "difficulty breathing" → respiratory
    flag) and populates `intake.redFlags`. Swap this for a real clinical
    rules engine or an LLM-based classifier later.

- **`src/components/VoiceMic.jsx`** — Reusable mic button with a persistent
  "Listening…" mock state. Clearly commented where to swap in the real
  `window.SpeechRecognition` / `webkitSpeechRecognition` API and
  `window.speechSynthesis` for TTS.

- **`src/components/Header.jsx`** — Top nav with the Patient Kiosk /
  Doctor Dashboard role toggle, backed by `role` in `KioskContext`.

- **`src/App.jsx`** — Main layout. Renders the kiosk flow or the doctor
  dashboard based on `role`. Kiosk flow uses a tiny mock step-array
  "router" (`KIOSK_STEPS`) — swap for `react-router` once you add more
  screens.

- **`src/screens/LanguageSelect.jsx`** — Grid of regional languages
  (tap targets ≥56px), writes to `patient.language`.

- **`src/screens/IntakeScreen.jsx`** — Chat-style chief-complaint capture:
  tappable common-symptom cards, a text fallback, and the `VoiceMic`
  component. Shows a live red-flag banner the moment a rule matches.

- **`src/screens/DoctorDashboard.jsx`** — Reads the full context as an
  "AI-Generated Clinical Summary" card, a prominent red-flag alert block,
  and "Confirm & Save".

## Design system

- Soft medical palette: `medi` (green, primary/patient-facing) and
  `skyclin` (blue, doctor-facing accents) — see `tailwind.config.js`.
- All primary buttons are ≥56px tall for kiosk-friendly tap targets
  (enforced globally in `src/index.css` too).

## Placeholders / TODO

Marked directly in code with `TODO` / `[Placeholder]` comments:

- `App.jsx` → `PlaceholderScreen` for the next intake step (HPI detail
  capture, drug & allergy history capture, vitals, review & submit).
- Real Web Speech API / TTS wiring in `VoiceMic.jsx`.
- Real red-flag / clinical rules engine (or LLM call) in `KioskContext.jsx`.
- ABHA ID linking flow (`patient.abhaId`) — currently just a data field.
- PWA manifest + service worker (add `vite-plugin-pwa` when ready).
- Persistence layer (currently in-memory only — state resets on refresh).

## Tech stack

- React 18 + Vite
- Tailwind CSS
- React Context (no external state library)
- lucide-react for icons
