### Brand Identity & Platform Name Candidates

For high-end medical spas in Beverly Hills, Miami, London, and Dubai, the brand must feel like luxury architectural editorial software—not a cheap SaaS chatbot.

* **Vespera AI (Selected Champion):** Evokes the evening (*vesper*), directly answering your value proposition: capturing the 40%+ of high-ticket appointments lost when clinics close after 6:00 PM.
* **AuraPulse:** Modern, clinical, and clean. Centers on patient aesthetics and real-time responsiveness.
* **Lumière Health:** High-end French aesthetic lineage; conveys skin luminosity and precision medical triage.

---

### The Color Palette: "Alabaster & Champagne Silk"

This palette avoids harsh tech neons, generic blues, and flat monochrome. It uses warm alabaster, crushed pearl, soft champagne-rose highlights, and deep charcoal slate for typography.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Surface 0 (Canvas):      #FAF8F5  (Warm Alabaster / Milk Silk)        │
│  Surface 1 (Cards/Glass): #FFFFFF  (Pure Pearl with 70% opacity blur)  │
│  Surface 2 (Elevated):    #F3EFEA  (Tuscan Linen / Soft Bone)          │
│  Border / Subtlety:       #E8E2D9  (Cashmere Border Stroke)            │
│  Primary Accent:          #D4A373  (Burnished Champagne Gold)          │
│  Secondary Glow:          #E8C5B0  (Silk Rose / Soft Blush)            │
│  Text Primary:            #1A1715  (Deep Espresso Basalt)              │
│  Text Muted:              #7A7269  (Warm Slate Grey)                   │
│  Success / Approved:      #5E826D  (Eucalyptus Sage Green)             │
│  Flagged / Contraindicated:#A65B5B (Subdued Terracotta Rose)           │
└────────────────────────────────────────────────────────────────────────┘

```

---

```markdown
# DESIGN.md — Vespera AI Design System & Experience Architecture

**Aesthetic Direction:** Editorial Luxury Aesthetics × Modern Haptic Interaction.
**Inspiration:** High-fashion luxury monographs, Apple VisionOS spatial clarity, and Leica tactile physical dials.
**Core Principle:** No generic centered hero headings. No 50/50 split landing sections with cartoon vectors. Every interaction uses subtle GSAP micro-physics and glassmorphic depth.

---

## 1. Typography & Spatial Geometry

### Font Pairing
*   **Display / Editorial Headings:** `Editorial New` or `Instrument Serif` (Italicized accents). Conveys timeless clinical prestige and editorial luxury.
*   **Interface / Data / System:** `Plus Jakarta Sans` or `Geist Sans` (Tracking: `-0.02em`). Ultra-crisp legibility for clinical lead metrics, patient data tables, and live logs.
*   **Numeric / Timestamps:** `JetBrains Mono` (0.85em scale). Clean monospaced precision for prices, downtime counters, and latency figures.

### Spatial Scale & Radius
*   `radius-card`: `20px` with a subtle inner highlight (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8)`).
*   `radius-button`: `9999px` (Pill format with 1px border `rgba(212, 163, 115, 0.3)`).
*   `blur-glass`: `backdrop-filter: blur(16px) saturate(180%)`.

---

## 2. Non-Cliché Homepage Architecture (GSAP Scroll-Driven)

### Section 1: The Asymmetrical Staggered Hero (Not Centered, Not 50/50)
*   **Layout:** An offset 12-column editorial canvas. 
    *   **Columns 1–7 (Top-Left Weighted):** A compact luxury badge (`● AFTER-HOURS CLINICAL CONCIERGE`), followed by a high-fashion typography lockup: *"Capturing the \$1,500 consultations your front desk sleeps through."*
    *   **Columns 8–12 (Floating Ambient Viewport):** An interactive, tactile **Live Aesthetic Ledger**. Instead of a mock illustration, it displays a real-time glass stream of high-ticket inquiries closing in real time (e.g., *"Sarah T. • Dallas, TX • Booked Morpheus8 Full Face [\$1,250] • 11:42 PM"*).
*   **GSAP Interaction:** As the user scrolls, the background canvas shifts with a subtle caustic light wave (`feTurbulence` SVG shader), while typography elements reveal via staggered vertical clipping (`yPercent: 100` to `0` with `power4.out`).

### Section 2: The Multi-Agent Live Triage Canvas (Interactive Stacking Ribbon)
*   **Layout:** A horizontal pinned scroll section where users slide through the 3 agent tiers:
    1.  **Card 01 — The Router:** Visualizes an incoming DM arriving at 10:14 PM with ambient typing particles.
    2.  **Card 02 — The Clinical Protocol Engine (RAG):** Displays an ultrasound-style translucent scan inspecting medical contraindications (e.g., highlighting *"Accutane detected in chat $\rightarrow$ Diverting from Chemical Peel to Hydrafacial"*).
    3.  **Card 03 — The Booking Handoff:** Instantly generates a tactile, micro-animated calendar chip locking in an appointment with zero latency.
*   **Micro-Interaction:** Hovering over any card triggers a magnetic pull (`quickTo` GSAP physics) and an iridescent pearl reflection across the border.

### Section 3: The Voice Telephony Experience (Haptic Audio Sphere)
*   **Layout:** A full-width dark champagne-slate vignette section demonstrating Phase 4/5 Outbound Lead Recovery.
*   **The Visual:** A 3D interactive, pulsating liquid-silk audio orb (Three.js/Canvas). 
*   **Interaction:** Visitors click **"Listen to Live Recovery Call"**. The orb ripples dynamically to realistic voice frequencies:
    > *"Hi Jessica, this is Dr. Sterling's concierge. We noticed you checked our Morpheus8 pricing last night but didn't finish booking. We had a VIP cancellation tomorrow at 2:00 PM—would you like me to hold that for you?"*
*   Live captions stream below in monospaced gold text, accompanied by an interactive SMS preview popping onto a mock device screen.

### Section 4: The Revenue Leakage Calculator (Dopamine Dial)
*   **Layout:** A luxury mechanical slider allowing med spa owners to choose their monthly web visitor volume and average treatment price (e.g., \$850).
*   **Feedback:** An animated odometer (`NumberFlow`) displays their estimated lost after-hours revenue spinning from **\$0** to **\$18,700/mo**, paired with a single champagne CTA: *"Stop the Leakage with Vespera"*.

---

## 3. High-Density Dashboard Specification (Next.js App Router)

The dashboard uses a unified command-bar architecture. No generic gray boxes; every view is a crisp, responsive, high-density data canvas.


```

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Vespera Mark]  Studio: Sterling Aesthetics (Miami, FL)       [Search / Cmd+K]  (User) │
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│ • Overview   │  TODAY'S RECOVERED REVENUE    AFTER-HOURS BOOKINGS    TRIAGE ACCURACY   │
│ • Patients   │  $4,250.00 (+32%)             7 Appointments          100% (0 Flags)    │
│ • Simulator  ├─────────────────────────────────────────────────────────────────────────┤
│ • Knowledge  │  PATIENT TRIAGE STREAM                                                  │
│ • Voice Hub  │  ┌────────────────────────────────────────────────────────────────────┐ │
│ • Settings   │  │ 11:04 PM • Elena Rostova • Inquired: Profhilo + Dermal Fillers     │ │
│              │  │ Status: [Medically Cleared] • Action: Booked via Boulevard ($950)  │ │
│              │  ├────────────────────────────────────────────────────────────────────┤ │
│ [Live Agent] │  │ 09:42 PM • Marcus Vance • Inquired: Erbium Laser Resurfacing       │ │
│ Active: OK   │  │ Status: [Contraindication Flag: Active Tan] • Action: Diverted     │ │
└──────────────┴──┴────────────────────────────────────────────────────────────────────┴─┘

```

### Dashboard View Architecture
1.  **`/dashboard` (Executive Overview):**
    *   **Metric Tiles:** Glass cards featuring micro-sparklines and real-time revenue counters.
    *   **Live Stream:** Webhook feed updating via Supabase Realtime with silky layout animations (`framer-motion` / `layoutId`).
2.  **`/dashboard/patients` (Unified PMS/CRM Data Grid):**
    *   Custom high-density table built on TanStack Table.
    *   Columns: Patient, Channel Badge (Instagram/Web/Voice), Requested Procedure, Medical Flag Status, Est. Value, Action Menu.
    *   Row expansion reveals the complete multi-agent reasoning trace.
3.  **`/dashboard/chat-tester` (The Clinical Simulator):**
    *   Left Viewport: iOS-style satin glass chat panel simulating inbound inquiries.
    *   Right Viewport: **Live Thought Inspector**. Reveals which vectors were queried from Qdrant, the exact similarity scores, and which safety rules were enforced.
4.  **`/dashboard/settings/knowledge` (RAG Engine Room):**
    *   Dropzone styled with champagne dashed borders and silky drag hover states.
    *   Document list displays extraction status, chunk count, and vector embedding health.

---

## 4. Bespoke SVG Iconography System

Avoid generic, thick-stroked Lucide icons for brand elements. Use ultra-fine (`stroke-width: 1.25px`) bespoke icons that reflect medical aesthetics:

```html
<!-- 1. The Vespera Monogram (Hourglass Meets Aesthetic Droplet) -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A373" stroke-width="1.25">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke-dasharray="1 3"/>
  <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

<!-- 2. Medical Protocol Check (Stethoscope cross with clean spark) -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5E826D" stroke-width="1.25">
  <path d="M12 3v18M3 12h18" stroke-linecap="round"/>
  <circle cx="12" cy="12" r="3" fill="#FAF8F5" stroke="#5E826D"/>
</svg>

<!-- 3. Telephony Waveform Spark (Haptic Audio Indicator) -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A373" stroke-width="1.25">
  <path d="M3 12h2m3-5v10m3-8v6m3-11v16m3-7v4m3-3h2" stroke-linecap="round"/>
</svg>

```

---

## 5. Frontend State Management Architecture (Zustand)

Global UI and tenant states are cleanly isolated from server cache:

```typescript
// apps/web/src/store/useAppStore.ts
import { create } from 'zustand';

interface AppState {
  // Tenant & Context
  activeSpaId: string | null;
  activeRole: 'owner' | 'manager' | 'front_desk' | null;
  setActiveSpa: (id: string, role: 'owner' | 'manager' | 'front_desk') => void;

  // Simulator State
  simulatorLogs: Array<{ agent: string; action: string; timestamp: string }>;
  addSimulatorLog: (log: { agent: string; action: string; timestamp: string }) => void;
  clearLogs: () => void;

  // Human Takeover Overrides
  pausedSessions: Record<string, boolean>; // triage_session_id -> boolean
  toggleHumanTakeover: (sessionId: string, status: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSpaId: null,
  activeRole: null,
  setActiveSpa: (id, role) => set({ activeSpaId: id, activeRole: role }),

  simulatorLogs: [],
  addSimulatorLog: (log) => set((state) => ({ simulatorLogs: [log, ...state.simulatorLogs] })),
  clearLogs: () => set({ simulatorLogs: [] }),

  pausedSessions: {},
  toggleHumanTakeover: (sessionId, status) =>
    set((state) => ({
      pausedSessions: { ...state.pausedSessions, [sessionId]: status },
    })),
}));

```

```

---

### Key Highlights of this Design
1.  **No Centered Generic Landing Clichés:** The landing page uses an asymmetrical editorial grid with an interactive live ledger on the right and an audio-haptic orb for the voice agent.
2.  **Addictive Aesthetic:** Uses warm alabaster, crushed pearl, soft linen, and burnished champagne-gold accents rather than flat grey or dark neons.
3.  **Ready for Autonomous Coding:** The `DESIGN.md` spec outlines exact CSS variables, typography pairings, component layouts, and Zustand state structures for immediate implementation.

```