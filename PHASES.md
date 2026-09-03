
# PLATFORM_MASTER_ROADMAP.md

## Vertical & Business Goal

**Medical Spa Lead Triage, Clinical Protocol Checking, and Voice Telephony**
A B2B SaaS platform ($750 - $1,500/mo) designed to capture after-hours aesthetic leads, strictly enforce medical safety rules via RAG, drive direct CRM bookings, and recover abandoned leads via autonomous voice agents.

---

## Architecture & Technology Stack

* **Frontend Client:** Next.js 14+ (App Router), Tailwind CSS, `shadcn/ui`, Zustand.
* **API & Orchestration:** FastAPI (Python 3.11+).
* **Database & Auth:** Supabase (PostgreSQL with Row Level Security).
* **Vector Database:** Qdrant (or Supabase pgvector) for storing clinic-specific RAG embeddings.
* **Agent Engine:** Gemini 2.0 Flash (Phase 1) $\rightarrow$ OpenAI Agent SDK (Phase 2+).
* **Background Processing:** Celery + Redis (Task queues for webhooks, DB syncing, CRON jobs).
* **Abstraction Layers:**
* `BasePMSAdapter` (Internal Supabase $\rightarrow$ NexHealth/Boulevard/Zenoti).
* `BaseVoiceAdapter` (Retell AI WebSockets $\rightarrow$ LiveKit WebRTC).



---

## Phase 1: Multi-Tenant MVP & The Universal PMS Layer

**Focus:** Foundation, Data Isolation, and the Baseline AI Triage Worker.

* **Multi-Tenant Database & RLS:**
* Setup `spas`, `spa_members`, `patients`, and `triage_sessions` tables in Supabase.
* Apply Row Level Security (RLS) so all queries require a valid `spa_id` from the Supabase JWT.


* **The Universal PMS Adapter:**
* Implement the `BasePMSAdapter` interface in FastAPI.
* Build the `InternalSupabaseAdapter` as the default Phase 1 behavior, seamlessly storing patient records in the local `patients` table.


* **RAG Knowledge Ingestion:**
* Next.js dashboard includes a Settings page for clinic owners to upload their "Treatment Menu & Protocol Rules" (PDF/Markdown).
* FastAPI chunks the documents (`RecursiveCharacterTextSplitter`) and stores embeddings in Qdrant, strictly tagged by `spa_id`.


* **The Single-Worker Triage Agent:**
* A single FastAPI endpoint (`POST /api/v1/chat`).
* Uses Gemini 2.0 Flash to retrieve relevant pricing/safety rules from Qdrant, check for red flags, and output a direct booking link.
* The Next.js dashboard features a `/chat-tester` mimicking an Instagram DM to safely test the AI before live deployment.



---

## Phase 2: Autonomous Multi-Agent Orchestration

**Focus:** Complex Reasoning, Tool Calling, and Medical Safety Handoffs.

* **Orchestration Upgrade:**
* Migrate the single prompt loop to a multi-agent framework using the OpenAI Agent SDK.


* **The Agent Team:**
* **Router Agent:** Classifies intent (Medical vs. Pricing vs. Direct Booking) and delegates the task.
* **Clinical Protocol Agent:** Triggers Qdrant RAG tools to enforce safety constraints. For example, if a patient asks for a chemical peel, it checks the rulebook and autonomously asks: *"Are you currently using Accutane?"*
* **Booking Agent:** Once medically cleared, it executes `pms_adapter.upsert_patient()` to save the lead, and outputs the scheduling URL.


* **State Persistence:**
* Every tool call, reasoning step, and state transition is appended as a JSON payload to `triage_sessions.ai_transcript`.



---

## Phase 3: Omnichannel Unified Inbox & External PMS Expansion

**Focus:** Real-world connectivity, Background Queues, and Human-in-the-Loop constraints.

* **Omnichannel Webhooks & Celery:**
* Open FastAPI webhooks for Instagram Graph API and a website chat widget.
* Redis and Celery debounce the incoming messages to prevent rate-limit crashes and ensure sequential agent processing.


* **The Unified Inbox (Next.js):**
* A live, real-time dashboard view (`/inbox`) displaying active patient conversations across all channels.


* **Human Takeover Engine:**
* A "Pause AI" button in the inbox updates the database (`status = 'human_takeover'`).
* Celery checks this flag before running the Agent SDK. If true, the webhook is bypassed, allowing front-desk staff to message VIP clients manually.


* **External PMS Integrations:**
* Add `NexHealthAdapter` and `BoulevardAdapter` to the PMS layer.
* Agent prompts remain unchanged, but the backend now dynamically syncs leads directly into the clinic's native medical software.



---

## Phase 4: Outbound Voice Recovery Engine

**Focus:** Revenue recovery and the Voice Abstraction Layer.

* **The Universal Voice Adapter:**
* Implement `BaseVoiceAdapter` in FastAPI. Start by pointing it at **Retell AI (Custom LLM Mode)** to handle telephony transport, while your server manages the logic via WebSockets.


* **The Abandoned Lead Trigger:**
* A Celery Beat scheduled task runs every 15 minutes, searching the DB for chats stuck in `qualifying` status for over 2 hours.


* **Outbound Voice Execution:**
* FastAPI triggers the Voice Adapter to initiate a call to the patient's phone.
* The Agent System Prompt is dynamically loaded: *"You are calling Sarah. She asked about Botox pricing 2 hours ago. Offer to lock in tomorrow's 2 PM slot."*
* Successful conversions trigger the PMS tool to finalize the booking.



---

## Phase 5: Inbound Virtual Receptionist

**Focus:** Full telephony replacement and LiveKit transition.

* **Inbound Call Handling:**
* The clinic ports their front-desk phone number. Inbound calls are routed via SIP trunking to your Voice Adapter.


* **Real-time AI Conversational Processing:**
* The voice agent natively handles spoken queries for pricing, directions, and availability by querying Qdrant in real-time.
* It utilizes background tools to execute actions silently (e.g., triggering a task to SMS the booking link to the caller's phone number before ending the call).


* **LiveKit Transition (Optional Scale-Out):**
* Once the system scales and Retell's per-minute platform fees become a burden, you implement the `LiveKitVoiceAdapter` inside your abstraction layer.
* You route SIP trunks directly into self-hosted LiveKit Python workers, eliminating middleman platform fees entirely while the frontend and database remain completely untouched.



---