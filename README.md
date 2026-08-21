# SitePulse AI

Web dashboard for parsing unstructured site inspection notes into structured JSON using Next.js and Vercel AI SDK.

## Features

- Parse raw voice notes, emails, and field logs into structured data
- Supports local LLM (Ollama) and cloud providers (OpenAI, Gemini)
- Interactive dashboard for editing and exporting inspection reports

## Getting Started

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Setup

Create a `.env.local` file in the project root:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```
