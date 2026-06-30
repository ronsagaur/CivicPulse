# CivicPulse 🏛️

**An AI-powered civic accountability platform that closes the loop between citizens reporting problems and municipal authorities resolving them — with AI and community verification at every step.**

> Existing systems treat *reporting* as the end. CivicPulse treats it as the **beginning** of a transparent, auditable lifecycle that only ends when the community confirms and verifies the resolution.

---

## ⚡ Quickstart

Ensure you have your environment variables set up in `.env`:
```bash
DATABASE_URL="postgresql://..."
GEMINI_API_KEY="AIzaSy..."
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
```

Install dependencies and start the development server:
```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## 🗺️ Platform Surfaces

The platform consists of four primary responsive dashboards:

| Surface | Route | Description |
|---|---|---|
| 📱 **Citizen Portal** | `/` | Map-first dashboard to report local issues, verify neighbors' claims, track ticket timelines, and inspect the ward health score. |
| 🏛️ **Command Center** | `/authority` | Dashboard for municipal officers. Includes an SLA-sorted focus queue, one-click progress updates (Acknowledge, Start Work, Resolve), and department scorecards. |
| 🌐 **Public Ledger** | `/ledger` | City-wide transparency layer showing neighborhood health indexes, ward rankings, category shares, and active predictive risk forecasting. |
| 🤖 **Agent Control Center** | `/agents` | Pipeline dashboard to monitor autonomous AI actions: Sentinel Intake classification, Dispatcher routing, and SLA Watchdog escalations. Includes a stress-testing resilience console. |

---

## 🎬 Live Interactive Demo Script

Open **two browser windows** side by side (one citizen view, one authority view) to experience the real-time polling updates:

1. **Intake** (Citizen): Report a new issue using a sample preset (e.g., Pothole, Sewage). Watch the **Gemini 2.5 Flash** model autonomously classify the image, determine the severity, and auto-draft a description.
2. **Consensus** (Citizen Home): Neighbors see the new issue. Clicking **Confirm** registers community consensus. Once the trust threshold is met, the issue is verified and routed.
3. **Dispatch** (Authority): The ticket appears in the SLA-prioritized Command Center queue. The municipal officer clicks **Acknowledge** ➔ **Start work** ➔ **Resolve**.
4. **Re-Verification** (Citizen): The citizen receives a prompt asking, *"Is it really fixed?"*
   - Clicking **Yes, it's fixed** closes the ticket permanently.
   - Clicking **No, still broken** reopens the ticket, escalates it to the next authority level, and flags it on the public ledger.
5. **Auditing** (Ledger): Review the public scorecard. Wards with delayed fixes show lower health grades, encouraging equitable resource distribution.

---

## 🧠 AI Agent & Verification Pipeline

The platform runs an advanced multi-agent verification system:

* **Sentinel Agent (Multimodal Ingestion)**: Processes uploaded media using Gemini API. Extracts category, severity (1-5), visual quality score, and flags fraud/spam signals.
* **Dispatcher Agent (Urgency Routing)**: Uses Gemini Tool Calling to map verified tickets to appropriate government departments with custom SLA deadlines.
* **Consensus Auditor**: Aggregates nearby complaints to auto-merge duplicates and counts local verifications to adjust citizen trust scores.
* **Coordinator Agent (SLA Watchdog)**: Periodically scans active tickets. Auto-escalates breached tickets to higher district administrators.
* **AI Ward Guardian**: A RAG-based conversational assistant in the citizen feed answering questions about municipal performance.

---

## 🏗️ Architecture & Stack

- **Core**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Vanilla CSS (Plus Jakarta Sans & Playfair Display typography)
- **Database**: PostgreSQL with Prisma ORM
- **Maps**: Google Maps JavaScript SDK (`@googlemaps/js-api-loader`)
- **AI Core**: Gemini SDK (`@google/generative-ai`) for image analysis, tool calling, and RAG
- **Icons**: Lucide React

---

## 🔌 API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/reports` | Get reports list (filterable by status/category/ward) |
| `POST` | `/api/reports` | Create a new report (processes AI classification) |
| `GET` | `/api/reports/:id` | Retrieve report details & assigned department info |
| `POST` | `/api/reports/:id/verify` | Submit citizen verification verdict |
| `POST` | `/api/reports/:id/upvote` | Upvote an issue (aggregates duplicate claims) |
| `POST` | `/api/reports/:id/confirm-resolution` | Submit resolution re-verification verdict |
| `POST` | `/api/reports/:id/simulate-breach` | Trigger SLA breach and escalate ticket |
| `POST` | `/api/reports/:id/simulate-consensus` | Simulate neighborhood consensus confirmations |
| `POST` | `/api/authority/reports/:id/status` | Update department action state |
| `POST` | `/api/chatbot` | Conversation endpoint for AI Ward Guardian |
| `GET` | `/api/analytics` | Fetch ward and department performance metrics |
| `POST` | `/api/reset` | Restore database to the seeded demo state |
