# 🏭 Unstructured Input to Clean Dashboard Parser (SitePulse AI)

A production-grade, privacy-first web application built with **Next.js 14 (App Router)**, **TypeScript**, **Zod**, and **Vercel AI SDK**. 

It ingests messy, unstructured site inspection notes (voice memo transcripts, emails, field hazard logs) and leverages dynamic LLM orchestration (**Local Ollama** or **Cloud OpenAI / Gemini**) to parse the input into a strict JSON schema, validate type safety, and render an interactive, editable site inspection dashboard card.

---

## 📐 Architecture & Data Flow

```
                 ┌─────────────────────────────────────────┐
                 │       Unstructured Input Text           │
                 │ (Voice Memo / Email / Raw Field Logs)   │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                 ┌─────────────────────────────────────────┐
                 │       SiteCardDashboard (Client)        │
                 │   - Quick Sample Presets                │
                 │   - Live LLM Provider Selector          │
                 └────────────────────┬────────────────────┘
                                      │ POST /api/parse
                                      ▼
                 ┌─────────────────────────────────────────┐
                 │     Next.js Route Handler (Server)      │
                 │      - Dynamic Provider Factory         │
                 │      - Health Check & Fallbacks         │
                 └──────────┬───────────────────┬──────────┘
                            │                   │
      [LLM_PROVIDER=ollama] │                   │ [LLM_PROVIDER=openai/google]
                            ▼                   ▼
            ┌───────────────────────┐   ┌───────────────────────┐
            │   Local Ollama Engine │   │   Cloud AI Provider   │
            │ (llama3.2 / qwen2.5)  │   │  (gpt-4o-mini /       │
            │  http://localhost:    │   │   gemini-1.5-flash)   │
            │        11434          │   └───────────┬───────────┘
            └───────────┬───────────┘               │
                        │                           │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                 ┌─────────────────────────────────────────┐
                 │        Vercel AI SDK `generateObject`   │
                 │     Strict Zod Validation Enforcement   │
                 └────────────────────┬────────────────────┘
                                      │ Validated JSON
                                      ▼
                 ┌─────────────────────────────────────────┐
                 │       Interactive Editable Card         │
                 │  - Urgency Badge (Low/Med/High/Critical)│
                 │  - Equipment Table & Status Pills       │
                 │  - Observation & Action Step Editors    │
                 │  - Copy & Download Clean JSON           │
                 └─────────────────────────────────────────┘
```

---

## 🚀 Local vs Cloud Execution Guide

### 1. Running with Local Ollama (Zero-Data-Leakage Privacy Mode)

To run fully offline without sending sensitive client data to third-party APIs:

1. **Install & Start Ollama**:
   ```bash
   # Linux / macOS
   curl -fsSL https://ollama.com/install.sh | sh
   ollama serve
   ```

2. **Pull Recommended Model**:
   ```bash
   ollama run llama3.2
   ```

3. **Environment Configuration**:
   Ensure `.env.local` has:
   ```env
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```

---

### 2. Running with Cloud APIs (OpenAI / Google Gemini)

To test high-speed cloud generation:

1. Add your API keys to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini

   # OR
   GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
   GOOGLE_MODEL=gemini-1.5-flash
   ```

2. Select **OpenAI** or **Gemini** in the application's header toggle to switch runtime providers dynamically on per-request basis.

---

## 🛠️ Technical Trade-offs & Architectural Decisions

| Decision | Rationale & Trade-off |
| :--- | :--- |
| **Strict Zod Schema (`generateObject`)** | Enforces guaranteed JSON output format directly from LLM calls. Prevents UI null pointer exceptions by providing `.catch()` and `.default()` fallback boundaries. |
| **Dynamic Provider Abstraction (`lib/llm-provider.ts`)** | Decouples application logic from specific AI vendors. Allows seamless fallback between local Ollama instances for air-gapped security and Cloud models for low-latency scale. |
| **Client-Side Controlled Form State** | Gives inspectors complete agency to refine, correct, and add missing observations or equipment items before exporting official JSON artifacts. |
| **Local Privacy Mode First** | Ensures compliance for sensitive enterprise sites (defence, healthcare, financial facilities) where streaming raw notes to external cloud APIs is restricted. |

---

## 🧪 Testing Matrix & Sample Inputs

The application includes built-in quick presets to test diverse input formats:

| Sample Preset | Unstructured Format | Key Extraction Verification |
| :--- | :--- | :--- |
| **Voice Memo Transcript** | Fragmented speech with filler words ("uh", "hey team"), time markers, and spoken numbers. | Validates HVAC status (`needs_repair`), budget (`$8,500`), and urgency (`high`). |
| **Messy Contractor Email** | Bullet points, email headers, informal notes, and mixed equipment statuses. | Validates Hydralic Pump status (`replace`), Overhead Crane (`operational`), budget (`$35,000`). |
| **Urgent Hazard Log** | High-priority emergency report, missing budget figures, critical safety hazards. | Validates Urgency (`critical`), Scrubber Pump status (`replace`), Null budget handling. |

---

## ⚡ Production Readiness & Next Steps

1. **Streaming JSON Objects (`streamObject`)**:
   - Upgrade from `generateObject` to `streamObject` for instant progressive rendering of card fields as the LLM generates tokens.
2. **Audio & Document File Ingestion**:
   - Add direct file upload for `.mp3`/`.wav` voice memos (via Whisper API / Local Whisper) and `.pdf` site inspection reports (via OCR ingestion).
3. **Vector Caching & Duplicate Inspection Linking**:
   - Implement semantic embeddings (e.g. pgvector) to link current inspection notes with past site history for the same client address.
4. **Export Formats**:
   - Add one-click export to official PDF inspection certificates and CSV asset inventory lists.

---

## 💻 Local Development Setup

```bash
# Clone repository and enter directory
cd intern

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to test the live application.
