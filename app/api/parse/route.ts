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

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json(
        { error: "Raw inspection text is required and cannot be empty." },
        { status: 400 }
      );
    }

    // Direct Instant Fallback Mode (< 10ms execution)
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

    let providerConfig;
    try {
      providerConfig = getLLMProviderConfig(providerOverride as ProviderType);
    } catch (configErr: any) {
      return NextResponse.json(
        { error: configErr.message || "Invalid provider configuration." },
        { status: 400 }
      );
    }

    const { provider, modelName, model } = providerConfig;

    const health = await checkProviderHealth(provider);
    if (!health.ok) {
      // Automatic failover to Heuristic Fallback when provider health check fails
      const fallbackData = fastFallbackParse(rawText);
      const executionMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        data: fallbackData,
        provider: `${provider} (Failed -> Fallback)`,
        modelName: `Instant Heuristic Engine (${executionMs}ms)`,
        fallbackUsed: true,
        warning: `Primary provider '${provider}' unavailable (${health.message}). Automatically recovered using Fast Fallback Engine.`,
      });
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

    // LLM with 8 second timeout + automatic fallback recovery
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("LLM processing timeout exceeded (8s)")), 8000)
    );

    const parsePromise = generateObject({
      model,
      schema: SiteInspectionSchema,
      system: systemPrompt,
      prompt: rawText.trim(),
    });

    const result: any = await Promise.race([parsePromise, timeoutPromise]);

    return NextResponse.json({
      success: true,
      data: result.object,
      provider,
      modelName,
      fallbackUsed: false,
    });
  } catch (error: any) {
    console.warn("LLM Extraction failed or timed out. Falling back to Instant Heuristic Engine:", error.message);

    // High-speed fallback recovery
    if (rawText && rawText.trim()) {
      const fallbackData = fastFallbackParse(rawText);
      const executionMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: fallbackData,
        provider: "fallback",
        modelName: `Instant Heuristic Engine (${executionMs}ms)`,
        fallbackUsed: true,
        warning: `LLM parsing failed or timed out (${error.message}). Recovered using Instant Heuristic Fallback Engine.`,
      });
    }

    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred during extraction.",
      },
      { status: 500 }
    );
  }
}

