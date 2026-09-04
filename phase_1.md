**GlowAgent AI — Phase 1 Project Architecture & Routing Specification**

### 🗺️ High-Level Project Tree

```text
GlowAgent/
├── 📁 apps/
│   ├── 📁 api/                              # 🐍 FastAPI Backend Application (Phase 1)
│   │   ├── 📁 app/
│   │   │   ├── 📁 api/                      # REST API Routers
│   │   │   │   └── 📁 routers/
│   │   │   │       ├── auth_router.py       # Supabase JWT validation hooks
│   │   │   │       ├── chat_router.py       # /api/v1/chat endpoint for Single Worker RAG
│   │   │   │       ├── knowledge_router.py  # PDF/Markdown upload and Qdrant ingestion
│   │   │   │       ├── patient_router.py    # Fetching leads for the Next.js CRM
│   │   │   │       └── tenant_router.py     # Spa settings and booking URLs
│   │   │   ├── 📁 core/                     # Infrastructure
│   │   │   │   ├── dependencies.py          # get_db, get_current_user, verify_spa_access
│   │   │   │   ├── security.py              # JWT decoding and RLS context injection
│   │   │   │   └── settings.py              # Env vars (Supabase, Gemini, Qdrant)
│   │   │   ├── 📁 db/                       # Supabase Postgres Connection
│   │   │   │   └── database.py
│   │   │   ├── 📁 models/                   # SQLAlchemy/Pydantic Models
│   │   │   │   ├── patient.py               # Patient lead schema
│   │   │   │   ├── spa.py                   # Tenant schema
│   │   │   │   └── triage_session.py        # Chat transcript schema
│   │   │   ├── 📁 services/                 # Business Logic
│   │   │   │   ├── 📁 pms/                  # The PMS Abstraction Layer
│   │   │   │   │   ├── base.py              # BasePMSAdapter interface
│   │   │   │   │   └── supabase_adapter.py  # InternalSupabaseAdapter (Phase 1 local CRM)
│   │   │   │   ├── ai_service.py            # Gemini 2.0 Flash prompt generation & execution
│   │   │   │   └── vector_service.py        # Qdrant chunking, embedding, and retrieval
│   │   │   └── main.py                      # FastAPI ASGI entrypoint & CORS config
│   │   ├── pyproject.toml
│   │   ├── uv.lock
│   │   └── Dockerfile
│   │
│   ├── 📁 web/                              # ⚛️ Next.js 14 App Router Frontend (Phase 1)
│   │   ├── 📁 app/                          # Next.js Route Tree
│   │   │   ├── 📁 (public)/                 # Landing Page & Marketing
│   │   │   │   ├── page.tsx                 # Main landing page (Med Spa ROI pitch)
│   │   │   │   └── layout.tsx               # Public navbar and footer
│   │   │   ├── 📁 (auth)/                   # Authentication
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx        # Tenant creation flow
│   │   │   ├── 📁 (dashboard)/              # Protected Tenant Application
│   │   │   │   ├── layout.tsx               # Sidebar navigation & context providers
│   │   │   │   ├── page.tsx                 # Overview / Analytics
│   │   │   │   ├── 📁 patients/             # Built-in Lead CRM
│   │   │   │   │   └── page.tsx             # Data table of captured leads
│   │   │   │   ├── 📁 chat-tester/          # AI Simulation UI
│   │   │   │   │   └── page.tsx             # Instagram DM mockup
│   │   │   │   ├── 📁 settings/             # Tenant Configuration
│   │   │   │   │   ├── page.tsx             # Booking URL, API keys
│   │   │   │   │   └── knowledge/page.tsx   # PDF/Markdown RAG upload zone
│   │   │   │   └── 📁 team/                 # Staff Management
│   │   │   │       └── page.tsx             # Invite front desk/managers
│   │   │   ├── globals.css                  # Tailwind directives
│   │   │   └── layout.tsx                   # Root HTML wrapper
│   │   ├── 📁 components/
│   │   │   ├── 📁 ui/                       # shadcn/ui primitives (buttons, tables, dialogs)
│   │   │   ├── 📁 layout/                   # Sidebar, Topbar, MobileNav
│   │   │   └── 📁 domain/                   # ChatBubble, PatientRow, UploadDropzone
│   │   ├── 📁 lib/
│   │   │   ├── supabase/                    # Supabase SSR client utilities
│   │   │   └── api-client.ts                # Axios wrapper pointing to FastAPI
│   │   ├── 📁 store/                        # Zustand stores (UI state)
│   │   ├── package.json
│   │   └── tailwind.config.ts
│   │
│   └── 📁 shared-types/                     # Shared TypeScript interfaces (if using Turborepo)
├── docker-compose.yml                       # Runs FastAPI, Qdrant, and Next.js locally
└── README.md

```

---

### 🛣️ Next.js 14 Frontend Routing Architecture

| Route Group | Path | Purpose |
| --- | --- | --- |
| **(public)** | `/` | **Landing Page:** Sells the software to Med Spa owners. Explains how 24/7 AI response stops revenue leakage. |
| **(auth)** | `/login` | Email/Password login via Supabase Auth. |
| **(auth)** | `/register` | Multi-step onboarding: Create account $\rightarrow$ Name Spa $\rightarrow$ Set up `spa_id` tenant. |
| **(dashboard)** | `/dashboard` | **Overview:** High-level metrics. Total leads captured, total AI conversations, booking click-through rate. |
| **(dashboard)** | `/dashboard/patients` | **The Phase 1 CRM:** A data table displaying all users who interacted with the bot. Columns: Name, Phone, Insta Handle, Requested Treatment, Status. |
| **(dashboard)** | `/dashboard/chat-tester` | **The Sandbox:** A split-screen UI. Left side: Chat interface mimicking Instagram DMs. Right side: AI reasoning logs (showing which rules it pulled from Qdrant). |
| **(dashboard)** | `/dashboard/settings` | **Configuration:** Set the clinic's public booking URL (Boulevard/NexHealth link) for the bot to hand out. |
| **(dashboard)** | `/dashboard/settings/knowledge` | **The RAG Engine Room:** Drag-and-drop zone to upload the "Clinic Menu & Rules" PDF. Shows processing status (Chunking $\rightarrow$ Embedded). |
| **(dashboard)** | `/dashboard/team` | **Staff Roster:** View and invite staff to the tenant workspace. |

---

### 🔐 Role-Based Access Control (RBAC) & Dashboard Permissions

Every route under `(dashboard)` verifies the user's role via the Supabase `spa_members` table before rendering.

| Role | Permitted Routes | Actions Allowed in Phase 1 |
| --- | --- | --- |
| **Owner** | All Routes | Can invite staff, view all leads, upload/delete RAG knowledge, update booking URLs, and test the AI. |
| **Manager** | All except `/team` | Can view leads, upload/update RAG knowledge (menu changes), and use the Chat-Tester. Cannot invite new staff or delete the workspace. |
| **Front Desk** | `/dashboard`, `/patients`, `/chat-tester` | Read-only access to the CRM to follow up on leads. Can test the AI to see how it responds. Cannot alter the knowledge base or settings. |

---

### 🖥️ UI Layout & Section Details

#### 1. Public Landing Page (`/`) Layout

* **Hero Section:** High-converting headline ("Stop Losing $1,500 Bookings at 11 PM"). Call to action (CTA) links to `/register`.
* **Demo Section:** An interactive mock-up showing a split-screen of an Instagram DM where the AI qualifies a patient and drops a booking link in 3 seconds.
* **Features Grid:**
* *Medical Guardrails:* "Ensures patients aren't on Accutane before booking lasers."
* *Direct Booking:* "Integrates with your existing Boulevard or Zenoti link."
* *Built-in CRM:* "Tracks every lead who talks to the bot."


* **Footer:** Links to Login, Terms, and Privacy.

#### 2. Dashboard Shell Layout (`/dashboard/*`)

* **Sidebar (Left, Fixed):**
* Tenant Switcher (Dropdown at top if owner manages multiple locations).
* Navigation Links: Overview, Patients (CRM), Chat-Tester.
* Bottom Settings section: Settings, Knowledge Base, Team.


* **Top Bar (Header):**
* Breadcrumbs indicating the current page.
* User Profile Dropdown (Logout, Account Settings).


* **Main Content Area:**
* **Patients View:** Uses `shadcn/ui` Data Table with pagination and a search bar to filter leads by name or treatment.
* **Chat-Tester View:** A mobile-phone sized container centered on the screen holding the chat UI. Uses a streaming text effect as the FastAPI backend returns Gemini's response tokens.
* **Knowledge Base View:** A `shadcn/ui` Dropzone component. Below it, a list of currently active uploaded documents with a "Delete/Replace" button.