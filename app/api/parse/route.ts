import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { SiteInspectionSchema } from "@/types/inspection";
import {
  getLLMProviderConfig,
  checkProviderHealth,
  ProviderType,
} from "@/lib/llm-provider";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawText = body.rawText;
    const providerOverride = body.providerOverride as ProviderType | undefined;

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json(
        { error: "Raw inspection text is required and cannot be empty." },
        { status: 400 }
      );
    }

    let providerConfig;
    try {
      providerConfig = getLLMProviderConfig(providerOverride);
    } catch (configErr: any) {
      return NextResponse.json(
        { error: configErr.message || "Invalid provider configuration." },
        { status: 400 }
      );
    }

    const { provider, modelName, model } = providerConfig;

    const health = await checkProviderHealth(provider);
    if (!health.ok) {
      return NextResponse.json(
        {
          error: `Provider '${provider}' health check failed: ${health.message}`,
          provider,
          modelName,
        },
        { status: 503 }
      );
    }

    const systemPrompt = `You are a world-class industrial site inspection analyst and structured data extractor.
Your job is to read raw, messy, unformatted inspection logs (voice memo transcripts, emails, field notes, emergency reports) and convert them into a clean JSON structure adhering strictly to the schema provided.

Rules for Extraction:
1. Client Name: Extract company or client name if present. Fall back to "Unknown Client".
2. Site Address: Extract full physical address or site location. Fall back to "Address Not Provided".
3. Inspection Date: Extract date if mentioned; otherwise default to today's date format (YYYY-MM-DD).
4. Budget Estimate: Extract monetary values mentioned for repairs, maintenance, or budget. If none, return null. Extract currency code (e.g. USD, EUR, GBP, CAD).
5. Urgency Level: Infer level ('low', 'medium', 'high', 'critical') based on keywords like "immediate", "emergency", "corroded", "failed", "routine", "hazard", "leaking".
6. Equipment Notes: Identify all individual equipment, tools, or machinery items mentioned. Categorize status accurately as 'operational', 'needs_repair', 'replace', or 'unknown'. Add concise remarks.
7. Key Observations: Extract distinct factual findings, safety issues, or physical conditions as an array of strings.
8. Next Steps: Extract recommended follow-up actions, maintenance orders, or scheduling items as an array of clear actionable strings.`;

    const result = await generateObject({
      model,
      schema: SiteInspectionSchema,
      system: systemPrompt,
      prompt: rawText.trim(),
    });

    return NextResponse.json({
      success: true,
      data: result.object,
      provider,
      modelName,
    });
  } catch (error: any) {
    console.error("API Parse Route Error:", error);

    let errorMessage = error.message || "An unexpected error occurred during AI extraction.";
    let statusCode = 500;

    if (error.code === "ECONNREFUSED" || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("connect ECONNREFUSED")) {
      errorMessage = "Could not connect to local Ollama service. Ensure Ollama is running on http://localhost:11434 ('ollama serve').";
      statusCode = 503;
    } else if (error.name === "AbortError" || errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      errorMessage = "The parsing request timed out. Local Ollama processing may require smaller prompt size or GPU acceleration.";
      statusCode = 504;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: statusCode }
    );
  }
}
