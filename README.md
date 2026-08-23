# Saniti — Site Inspection Log & Voice Parser

Saniti converts unstructured field inspection notes, voice recordings, and emails into structured JSON records for equipment maintenance and site ops.

Built with Next.js (App Router), TypeScript, Vercel AI SDK, Zod, and Web Audio / Whisper.

---

## Key Features

- **Structured Data Extraction**: Converts raw notes, pasted emails, and voice transcripts into a typed `SiteInspection` object using Zod schemas.
- **Voice Note Parsing**: Captures audio directly in the browser via MediaRecorder and transcribes locally using WebAssembly Whisper or a server fallback route.
- **Multi-Model Fallback Cascade**: Automatically cascades requests through Groq, Google Gemini, OpenAI, and local Ollama instances to ensure low latency and continuous service.
- **Record Status Workflow**: Classifies extracted records into `ready`, `needs_review`, or `dispatched` states depending on missing critical fields (client name, site location, budget estimate).
- **High-Density Ops Dashboard**: Clean table and card layout for viewing, filtering, editing, downloading JSON payloads, and managing client sites.
- **Custom API Key Storage**: Allows entering per-session or persistent API keys directly in the UI settings without modifying server environment variables.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| AI / LLM Framework | Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `ollama-ai-provider`) |
| Data Validation | Zod |
| Speech Recognition | `browser-whisper` + Web Speech API + Server Fallback |
| Icons | Lucide React |

---

## Getting Started

### 1. Prerequisites

- Node.js 18.x or later
- npm or pnpm
- (Optional) Local Ollama instance running `llama3.2` if testing without cloud API keys

### 2. Installation

```bash
git clone https://github.com/your-repo/intern.git
cd intern
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Selected provider: "auto", "groq", "google", "openai", or "ollama"
LLM_PROVIDER=auto

# Groq API
GROQ_API_KEY=gsk_...

# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# OpenAI API
OPENAI_API_KEY=sk-...

# Ollama Local LLM
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

*Note: You can also leave API keys empty in `.env.local` and enter them via the in-app **Settings** modal, which stores keys securely in `localStorage`.*

### 4. Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture & Data Flow

```
[ Unstructured Input ] ---> [ Client / Voice Recorder ]
                                    |
                                    v
                           [ /api/parse API Route ]
                                    |
                           [ Provider Cascade ]
                    (Groq -> Gemini -> OpenAI -> Ollama)
                                    |
                                    v
                        [ Zod Schema Validation ]
                                    |
                                    v
                     [ Next.js State / LocalStorage ]
                                    |
                                    v
                  [ Dashboard / Inspections / Clients ]
```

---

## Application Structure

```text
app/
├── api/
│   ├── parse/route.ts      # LLM processing & schema extraction
│   └── transcribe/route.ts # Server audio transcription fallback
├── clients/page.tsx        # Client summary & aggregated sites view
├── inspections/page.tsx    # Operations dashboard for inspection records
├── layout.tsx              # Root app layout & context wrapper
└── page.tsx               # Main extraction interface & chat input

components/
├── AppShell.tsx            # Main layout container & sidebar wrapper
├── ChatView.tsx            # Raw text & voice intake interface
├── ClientsView.tsx         # Client records & site aggregation view
├── DashboardView.tsx       # Filterable record dashboard
├── SettingsModal.tsx       # Provider & API key configuration
├── Sidebar.tsx             # Application navigation & status
└── SiteInspectionModal.tsx # Inspection view/edit detail modal

lib/
├── browser-whisper.ts      # Client-side audio processing & WebAssembly transcription
├── InspectionContext.tsx   # Persistent state management via LocalStorage
├── llm-provider.ts         # Multi-provider cascade execution logic
└── sample-records.ts       # Initial demo dataset

types/
├── chat.ts                 # Chat message & input type definitions
└── inspection.ts           # SiteInspection schema & status utility functions
```

---

## Extracted Data Schema

The extraction engine validates input against the following JSON schema:

```json
{
  "clientName": "ABC Industries",
  "siteAddress": "450 Industrial Pkwy, Bldg 3",
  "inspectionDate": "2026-08-20",
  "budgetEstimate": 25000,
  "currency": "INR",
  "urgencyLevel": "high",
  "keyObservations": [
    "Compressor motor overheating",
    "Strange vibration on Unit #3"
  ],
  "equipmentNotes": [
    {
      "name": "Unit #3 HVAC Compressor",
      "status": "needs_repair",
      "remarks": "Hotter than normal, noisy motor"
    }
  ],
  "nextSteps": [
    "Confirm equipment model",
    "Obtain formal quote for motor replacement"
  ]
}
```

---

## Development & Testing Commands

```bash
# Typecheck TypeScript files
npx tsc --noEmit

# Run ESLint audit
npm run lint

# Build production bundle
npm run build
```
