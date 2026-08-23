import { createOllama } from "ollama-ai-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type ProviderType = "ollama" | "openai" | "google";

export interface ProviderConfig {
  provider: ProviderType;
  modelName: string;
  model: any;
}

export function getLLMProviderConfig(
  providerOverride?: ProviderType,
  modelOverrideName?: string
): ProviderConfig {
  const provider = (
    providerOverride ||
    process.env.LLM_PROVIDER ||
    "ollama"
  ).toLowerCase() as ProviderType;

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OpenAI API Key is missing. Set OPENAI_API_KEY in your environment variables or choose Ollama for local mode."
      );
    }
    const modelName = modelOverrideName || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const openai = createOpenAI({ apiKey });
    return {
      provider: "openai",
      modelName,
      model: openai(modelName),
    };
  }

  if (provider === "google") {
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Google AI Key is missing. Set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables or choose Ollama for local mode."
      );
    }
    const modelName = modelOverrideName || process.env.GOOGLE_MODEL || "gemini-1.5-flash";
    const google = createGoogleGenerativeAI({ apiKey });
    return {
      provider: "google",
      modelName,
      model: google(modelName),
    };
  }

  const rawBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const modelName = modelOverrideName || process.env.OLLAMA_MODEL || "deepseek-coder:6.7b";
  const normalizedBase = rawBaseUrl.replace(/\/$/, "").replace(/\/v1$/, "").replace(/\/api$/, "");
  
  const ollamaOpenAI = createOpenAI({
    baseURL: `${normalizedBase}/v1`,
    apiKey: "ollama",
  });

  return {
    provider: "ollama",
    modelName,
    model: ollamaOpenAI(modelName),
  };
}

export async function checkProviderHealth(
  provider: ProviderType,
  requestedModelName?: string
): Promise<{ ok: boolean; message?: string; availableModel?: string }> {
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      return {
        ok: false,
        message: "OPENAI_API_KEY is not configured in .env environment.",
      };
    }
    return { ok: true };
  }

  if (provider === "google") {
    if (
      !process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
      !process.env.GEMINI_API_KEY
    ) {
      return {
        ok: false,
        message:
          "GOOGLE_GENERATIVE_AI_API_KEY is not configured in .env environment.",
      };
    }
    return { ok: true };
  }

  if (provider === "ollama") {
    const rawBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const healthUrl = rawBaseUrl.endsWith("/api")
      ? `${rawBaseUrl.replace(/\/api$/, "")}/api/tags`
      : `${rawBaseUrl.replace(/\/$/, "")}/api/tags`;

    try {
      const res = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        return {
          ok: false,
          message: `Ollama server responded with HTTP status ${res.status}.`,
        };
      }

      const data = await res.json();
      const installedModels: string[] = (data.models || []).map((m: any) => m.name);

      if (installedModels.length === 0) {
        return {
          ok: false,
          message: "Ollama server is running but has no models installed. Pull a model using 'ollama pull llama3.2' or 'ollama pull deepseek-coder:6.7b'.",
        };
      }

      const targetModel = requestedModelName || process.env.OLLAMA_MODEL || "llama3.2";
      // Find matching installed model or exact prefix match
      const matched = installedModels.find(
        (m) =>
          m === targetModel ||
          m.startsWith(`${targetModel}:`) ||
          targetModel.startsWith(m.split(":")[0])
      );

      if (matched) {
        return { ok: true, availableModel: matched };
      }

      // If requested model isn't installed, auto-select first available installed model
      const fallbackInstalled = installedModels[0];
      return {
        ok: true,
        availableModel: fallbackInstalled,
        message: `Model '${targetModel}' not found in Ollama. Auto-switched to installed model '${fallbackInstalled}'.`,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `Local Ollama instance is unreachable at ${rawBaseUrl}. Ensure Ollama is running ('ollama serve'). Error: ${err?.message || err}`,
      };
    }
  }

  return { ok: false, message: "Unsupported provider requested." };
}
