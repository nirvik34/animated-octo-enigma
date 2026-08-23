import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { SiteInspectionSchema } from "@/types/inspection";
import {
  getLLMProviderConfig,
  checkProviderHealth,
  ProviderType,
} from "@/lib/llm-provider";
import { fastFallbackParse } from "@/lib/fallback-parser";

export async function POST(req: Request) {
  const startTime = Date.now();
  let rawText = "";

  try {
    const body = await req.json().catch(() => ({}));
    rawText = body.rawText || "";
    const providerOverride = body.providerOverride as ProviderType | "fallback" | undefined;
    const forceFallback = body.forceFallback === true || providerOverride === "fallback";
    const apiKeys = body.apiKeys || {};

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json(
        { error: "Raw inspection text is required and cannot be empty." },
        { status: 400 }
      );
    }

    if (forceFallback) {
      const fallbackData = fastFallbackParse(rawText);
      const executionMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        data: fallbackData,
        provider: "fallback",
        modelName: `Instant Heuristic Engine (${executionMs}ms)`,
        fallbackUsed: true,
      });
    }

    const requestedProvider = (providerOverride || process.env.LLM_PROVIDER || "ollama").toLowerCase() as ProviderType;

    const health = await checkProviderHealth(requestedProvider, undefined, apiKeys);
    if (!health.ok) {
      const fallbackData = fastFallbackParse(rawText);
      const executionMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        data: fallbackData,
        provider: `${requestedProvider} (Unavailable -> Fallback)`,
        modelName: `Instant Heuristic Engine (${executionMs}ms)`,
        fallbackUsed: true,
        warning: `The AI provider '${requestedProvider}' is currently unreachable. A basic record was generated using keyword rules. Please review and edit the fields below.`,
      });
    }

    let providerConfig;
    try {
      providerConfig = getLLMProviderConfig(requestedProvider, health.availableModel, apiKeys);
    } catch (configErr) {
      const err = configErr as Error;
      return NextResponse.json(
        { error: err.message || "Invalid provider configuration." },
        { status: 400 }
      );
    }

    const { provider, modelName, model } = providerConfig;

    const systemPrompt = `You are a world-class industrial site inspection analyst and structured data extractor.
Your job is to read raw, messy, unformatted inspection logs (voice memo transcripts, emails, field notes, emergency reports) and convert them into a clean JSON structure adhering strictly to the schema provided.

Rules for Extraction:
1. Client Name: Extract company or client name if present. Fall back to "Client name not detected".
2. Site Address: Extract full physical address or site location. Fall back to "Address not detected".
3. Inspection Date: Extract date if mentioned; otherwise default to today's date format (YYYY-MM-DD).
4. Budget Estimate: Extract monetary values mentioned for repairs, maintenance, or budget. If none, return null. Extract currency code (e.g. USD, EUR, GBP, CAD).
5. Urgency Level: Infer level ('low', 'medium', 'high', 'critical') based on keywords like "immediate", "emergency", "corroded", "failed", "routine", "hazard", "leaking".
6. Equipment Notes: Identify all individual equipment, tools, or machinery items mentioned. Categorize status accurately as 'operational', 'needs_repair', 'replace', or 'unknown'. Add concise remarks.
7. Key Observations: Extract distinct factual findings, safety issues, or physical conditions as an array of strings.
8. Next Steps: Extract recommended follow-up actions, maintenance orders, or scheduling items as an array of clear actionable strings.`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI response timeout limit exceeded (8s)")), 8000)
    );

    const parsePromise = generateObject({
      model,
      schema: SiteInspectionSchema,
      system: systemPrompt,
      prompt: rawText.trim(),
    });

    const result = (await Promise.race([parsePromise, timeoutPromise])) as { object: unknown };

    return NextResponse.json({
      success: true,
      data: result.object,
      provider,
      modelName,
      fallbackUsed: false,
    });
  } catch (error) {
    const err = error as Error;
    console.warn("LLM Extraction failed or timed out. Falling back to Instant Heuristic Engine:", err.message);

    if (rawText && rawText.trim()) {
      const fallbackData = fastFallbackParse(rawText);
      const executionMs = Date.now() - startTime;

      const isTimeout = err.message?.includes("timeout");
      const userWarning = isTimeout
        ? "AI response timed out (8s limit). A basic record was generated using keyword rules. Please review and edit the fields below."
        : "AI model encountered an error during processing. A basic record was generated using keyword rules. Please review and edit the fields below.";

      return NextResponse.json({
        success: true,
        data: fallbackData,
        provider: "fallback",
        modelName: `Instant Heuristic Engine (${executionMs}ms)`,
        fallbackUsed: true,
        warning: userWarning,
      });
    }

    return NextResponse.json(
      {
        error: err.message || "An unexpected error occurred during extraction.",
      },
      { status: 500 }
    );
  }
}

