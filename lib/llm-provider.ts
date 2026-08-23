import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";

export type ProviderType = "auto" | "groq" | "google" | "openai" | "ollama";

export interface CustomApiKeys {
  openaiApiKey?: string;
  googleApiKey?: string;
  groqApiKey?: string;
  ollamaBaseUrl?: string;
}

export interface ProviderConfig {
  provider: ProviderType;
  modelName: string;
  model: LanguageModel;
}

export function getLLMProviderConfig(
  providerOverride?: ProviderType,
  modelOverrideName?: string,
  customApiKeys?: CustomApiKeys
): ProviderConfig {
  const provider = (
    providerOverride ||
    process.env.LLM_PROVIDER ||
    "ollama"
  ).toLowerCase() as ProviderType;

  if (provider === "openai") {
    const apiKey = customApiKeys?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OpenAI API Key is missing. Add your API key in Settings or set OPENAI_API_KEY in environment variables."
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
      customApiKeys?.googleApiKey ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Google Gemini API Key is missing. Add your API key in Settings or set GOOGLE_GENERATIVE_AI_API_KEY in environment variables."
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

  if (provider === "groq") {
    const apiKey = customApiKeys?.groqApiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Groq API Key is missing. Add your API key in Settings or set GROQ_API_KEY in environment variables."
      );
    }
    const modelName = modelOverrideName || process.env.GROQ_MODEL || "openai/gpt-oss-20b";
    const groqOpenAI = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    });
    return {
      provider: "groq",
      modelName,
      model: groqOpenAI(modelName),
    };
  }

  const rawBaseUrl = customApiKeys?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
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
  requestedModelName?: string,
  customApiKeys?: CustomApiKeys
): Promise<{ ok: boolean; message?: string; availableModel?: string }> {
  if (provider === "openai") {
    const apiKey = customApiKeys?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        message: "OPENAI_API_KEY is not configured in Settings or .env environment.",
      };
    }
    return { ok: true };
  }

  if (provider === "google") {
    const apiKey =
      customApiKeys?.googleApiKey ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        message: "GOOGLE_GENERATIVE_AI_API_KEY is not configured in Settings or .env environment.",
      };
    }
    return { ok: true };
  }

  if (provider === "groq") {
    const apiKey = customApiKeys?.groqApiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        message: "GROQ_API_KEY is not configured in Settings or .env environment.",
      };
    }
    return { ok: true };
  }

  if (provider === "ollama") {
    const rawBaseUrl = customApiKeys?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
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
      const installedModels: string[] = (data.models || []).map((m: { name: string }) => m.name);

      if (installedModels.length === 0) {
        return {
          ok: false,
          message: "Ollama server is running but has no models installed. Pull a model using 'ollama pull llama3.2' or 'ollama pull deepseek-coder:6.7b'.",
        };
      }

      const targetModel = requestedModelName || process.env.OLLAMA_MODEL || "llama3.2";
      const matched = installedModels.find(
        (m) =>
          m === targetModel ||
          m.startsWith(`${targetModel}:`) ||
          targetModel.startsWith(m.split(":")[0])
      );

      if (matched) {
        return { ok: true, availableModel: matched };
      }

      const fallbackInstalled = installedModels[0];
      return {
        ok: true,
        availableModel: fallbackInstalled,
        message: `Model '${targetModel}' not found in Ollama. Auto-switched to installed model '${fallbackInstalled}'.`,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        ok: false,
        message: `Local Ollama instance is unreachable at ${rawBaseUrl}. Ensure Ollama is running ('ollama serve'). Error: ${error?.message || String(err)}`,
      };
    }
  }

  return { ok: false, message: "Unsupported provider requested." };
}

