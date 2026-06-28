# CivicPulse

**An AI-powered civic accountability platform that closes the loop between citizens reporting problems and authorities solving them — with verification at every step.**

> Existing apps treat *reporting* as the end. CivicPulse treats it as the **beginning** of a transparent, auditable lifecycle that ends only when the community verifies resolution.

This repo is a **working MVP demo** of the full loop, runnable with zero external services:

```
Report → AI classify → Community verify → Route + SLA → Authority resolve → RE-VERIFY → Closed
```

---

## ⚡ Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

That's it. **No API keys, no database, no config required** — the app boots with seeded demo data and a mock AI classifier so the demo never breaks (even offline).

### The three surfaces
| Surface | Route | What it is |
|---|---|---|
| **Citizen** | `/` | Map-first home, 3-tap report flow, report timeline |
| **Authority** | `/authority` | SLA-sorted queue, one-click actions, public scorecard |
| **Public Ledger** | `/ledger` | City stats, ward rankings, department grades |

Switch between them with the top nav. Hit **Reset demo** anytime to restore the seeded state.

---

## 🎬 5-minute demo script

Open **two browser windows** side by side (or project one, hold the other) — both poll the same live backend, giving the "two-device" effect.

1. **Report** (Citizen → `Report an issue`): pick a sample issue → **Analyze with AI** → watch it detect the category + severity in ~1s → **Submit**. You land on the live status screen.
2. **Verify** (Citizen home): the **"Verify a neighbour's report"** card is waiting. Click **Confirm**. Watch the report flip to **VERIFIED** and auto-route to the right department with an SLA clock.
3. **Resolve** (Authority `/authority`): the report appears in the queue. Click **Acknowledge → Start work → Mark resolved**. Every change shows up live on the citizen side.
4. **The killer feature** (Citizen → open the report): the authority says it's fixed — *"Is it really?"*
   - Click **Yes, it's fixed** → status moves to **CLOSED & VERIFIED**.
   - Or click **No, still broken** → it **auto-reopens, escalates to the next authority level, and gets publicly flagged**. *This is the loop nobody else closes.*
5. **Public ledger** (`/ledger`): every authority is publicly graded. Watch the resolution rate tick up as you close reports.

Pre-seeded so step 2/4 work instantly:
- `CP-8404` (garbage) is one confirmation away from verifying.
- `CP-8401` (pothole) is already **resolved & awaiting your confirmation**.
- `CP-8403` (sewage) shows a report that **failed re-verification and was auto-escalated**.

---

## 🧠 The AI verification pipeline

The moat. Four stages, all implemented:

| Stage | Where | What it does |
|---|---|---|
| **4.1 Vision classification** | [`src/lib/ai.ts`](src/lib/ai.ts) | Photo → strict JSON: `category, severity, confidence, fraud_signals, …` |
| **4.2 Duplicate aggregation** | [`src/lib/store.ts`](src/lib/store.ts) | "Me too" upvotes merge duplicates and raise severity instead of flooding the queue |
| **4.3 Community verification** | `store.verifyReport` | Trust-band thresholds (New=5, Trusted=3, Champion=1 confirmations) |
| **4.4 Trust score engine** | [`src/lib/trust.ts`](src/lib/trust.ts) | `+5` verified report, `−10` spam, etc. — clamped `[0,100]` |
| **4.5 Resolution re-verification** | `store.confirmResolution` | Citizens confirm the fix on the ground — or reopen + escalate |

### Live AI (optional)
The classifier runs a **deterministic mock** by default. To use **real Claude vision**, copy `.env.example` to `.env` and set a key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
CIVICPULSE_AI_MODEL=claude-haiku-4-5   # fast + cheap; swap to claude-opus-4-8 for max accuracy
```

When a key is present *and* the report includes an uploaded photo, the app calls the [Anthropic Messages API](https://docs.anthropic.com/) with the blueprint's classifier prompt and parses the strict JSON. If the call fails for any reason, it **silently falls back to the mock** — your live demo can't break. The report-flow review screen shows a `🟢 live AI` / `🧪 demo AI` badge so you always know which path ran.

---

## 🏗️ Architecture

```
Next.js 14 App Router (one app, three surfaces)
├─ src/app/                 citizen / authority / ledger pages (client, live-polling)
│  ├─ page.tsx              citizen home (map + verify prompt)
│  ├─ report/new            3-step report flow with AI pre-fill
│  ├─ report/[id]           timeline + verify / re-verify actions
│  ├─ authority             SLA queue + scorecard
│  ├─ ledger                public transparency portal
│  └─ api/                  REST route handlers (the backend)
├─ src/lib/
│  ├─ types.ts              domain model + lifecycle state machine
│  ├─ store.ts              in-memory store + all lifecycle transitions
│  ├─ ai.ts                 classifier (live Claude vision + mock fallback)
│  ├─ seed.ts               realistic Mumbai demo data
│  ├─ trust.ts / geo.ts     trust engine + haversine geo
│  └─ analytics.ts          ward / department / category aggregations
└─ src/components/          MapView (Leaflet), ReportCard, TopNav, UI primitives
```

### Deliberate hackathon simplifications
This is a **demo**, optimized to run anywhere and never fail on stage. Where the [full blueprint](BrainStorming.docx) specifies production infrastructure, this MVP substitutes:

| Blueprint (production) | This MVP (demo) | Why |
|---|---|---|
| PostgreSQL + PostGIS + pgvector | In-memory seeded store (`globalThis` singleton) | Zero setup; survives dev hot-reloads |
| Kafka event bus + WebSockets | Fast HTTP polling (2–2.5s) | Same "live" feel, far simpler |
| Mapbox GL (token required) | Leaflet + OpenStreetMap tiles | No token, no signup |
| CLIP embeddings + pgvector dedupe | Geo + category + "me too" aggregation | Demonstrates the concept without a vector DB |
| 2-of-3 nearby quorum for re-verification | First community confirmation decides | Snappy single-click payoff on stage (noted in `store.ts`) |

> ⚠️ The in-memory store is per-process. It's perfect for `npm run dev` and a single long-running server (Railway/Render). On Vercel's serverless functions, state won't persist across cold invocations — swap `src/lib/store.ts` for a real DB (Postgres/Upstash) for a persistent deploy.

---

## 🔌 API reference

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/reports?status=&category=&wardId=` | List reports (filterable) |
| `POST` | `/api/reports` | Create a report (optionally with AI result) |
| `GET` | `/api/reports/:id` | Report detail + routed department |
| `POST` | `/api/reports/:id/verify` | Community verification `{verdict}` |
| `POST` | `/api/reports/:id/upvote` | "Me too" — aggregates duplicates |
| `POST` | `/api/reports/:id/confirm-resolution` | Re-verification `{verdict}` |
| `POST` | `/api/reports/:id/reopen` | Manual reopen + escalate |
| `POST` | `/api/authority/reports/:id/status` | `{action: ACKNOWLEDGE\|START\|RESOLVE}` |
| `POST` | `/api/classify-preview` | Stateless AI classification for the report flow |
| `GET` | `/api/analytics` | Ward / department / category rollups |
| `GET` | `/api/meta` | Wards, departments, users, current user |
| `POST` | `/api/reset` | Restore seeded demo data |

---

## 🧪 Tech stack

Next.js 14 · TypeScript · Tailwind CSS · Leaflet · lucide-react · (optional) Claude vision via the Anthropic API.

## 📦 Scripts

```bash
npm run dev     # local dev at :3000
npm run build   # production build (type-checked)
npm start       # serve the production build
```
