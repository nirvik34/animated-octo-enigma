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
    rawText = body.rawText || body.text || body.rawInspectionText || "";
    const providerOverride = (body.providerOverride || body.provider) as ProviderType | "fallback" | undefined;
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

    const rawRequested = (providerOverride || process.env.LLM_PROVIDER || "auto").toLowerCase();
    const isAuto = rawRequested === "auto" || rawRequested === "fastest";

    const providersToTry: ProviderType[] = isAuto
      ? ["groq", "google", "openai", "ollama"]
      : [rawRequested as ProviderType];

    const systemPrompt = `You are a world-class industrial site inspection analyst and structured data extractor.
Your job is to read raw, messy, unformatted inspection logs (voice memo transcripts, emails, field notes, emergency reports) and convert them into a clean JSON structure adhering strictly to the schema provided.

Rules for Extraction:
1. Client Name: Extract company or client name if present. If no company name is explicitly stated, check for primary contact persons (e.g. "John") or email contacts and format as "John (Contact Person)". If the input notes that paperwork is missing or unknown, format as "Unknown Client (Paperwork Missing)". Fall back to "Client name not detected" only if no contact context exists.
2. Site Address: Extract full physical address or site location. Fall back to "Address not detected".
3. Inspection Date: Extract date if mentioned (convert to YYYY-MM-DD if possible); otherwise default to today's date format (YYYY-MM-DD).
4. Budget Estimate: Extract monetary values mentioned for repairs, maintenance, or budget (e.g., 25000 rupees -> 25000). If none, return null. Extract currency code (e.g. USD, EUR, GBP, CAD, INR).
5. Urgency Level: Infer level ('low', 'medium', 'high', 'critical') based on keywords like "immediate", "emergency", "corroded", "failed", "routine", "hazard", "leaking", "overheating".
6. Equipment Notes: Identify all individual equipment, tools, or machinery items mentioned (e.g. "Compressor Unit #3"). Categorize status accurately as 'operational', 'needs_repair', 'replace', or 'unknown'. Add concise remarks.
7. Key Observations: Extract distinct factual findings, safety issues, or physical conditions as an array of strings. Do NOT include unrelated personal notes (like buying coffee or personal TODOs).
8. Next Steps: Extract recommended follow-up actions, maintenance orders, or scheduling items as an array of clear actionable strings.`;

    let lastError: Error | null = null;

    for (const targetProvider of providersToTry) {
      try {
        const health = await checkProviderHealth(targetProvider, undefined, apiKeys);
        if (!health.ok) continue;

        const providerConfig = getLLMProviderConfig(targetProvider, health.availableModel, apiKeys);
        const { provider, modelName, model } = providerConfig;

        const timeoutMs = isAuto ? 15000 : targetProvider === "ollama" ? 40000 : 25000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`AI response timeout limit exceeded (${Math.round(timeoutMs / 1000)}s)`)),
            timeoutMs
          )
        );

        const parsePromise = generateObject({
          model,
          schema: SiteInspectionSchema,
          system: systemPrompt,
          prompt: rawText.trim(),
        });

        const result = (await Promise.race([parsePromise, timeoutPromise])) as { object: unknown };
        const executionMs = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: result.object,
          provider: isAuto ? `auto (${provider})` : provider,
          modelName,
          executionMs,
          fallbackUsed: false,
        });
      } catch (err) {
        lastError = err as Error;
        console.warn(`Provider '${targetProvider}' attempt failed:`, lastError.message);
      }
    }

    const fallbackData = fastFallbackParse(rawText);
    const executionMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: fallbackData,
      provider: "fallback",
      modelName: `Instant Heuristic Engine (${executionMs}ms)`,
      executionMs,
      fallbackUsed: true,
      warning: lastError?.message
        ? `AI Model Notice: ${lastError.message}. Basic record generated via keyword engine.`
        : "AI Provider unreachable. Basic record generated via keyword engine.",
    });
  } catch (error) {
    const err = error as Error;
    const executionMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: err.message || "An unexpected error occurred during extraction.",
        executionMs,
      },
      { status: 500 }
    );
  }
}

