import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

let transcriber: any = null;
let activeDevice: "webgpu" | "wasm" = "wasm";

async function isWebGPUSupported(): Promise<boolean> {
  if (typeof self === "undefined" || !("gpu" in navigator) || !(navigator as any).gpu) return false;
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

async function initTranscriber() {
  if (transcriber) return transcriber;

  const modelName = "onnx-community/whisper-tiny.en";
  const webgpuOk = await isWebGPUSupported();

  if (webgpuOk) {
    try {
      activeDevice = "webgpu";
      self.postMessage({ type: "status", status: "initializing", device: "webgpu" });
      transcriber = await pipeline("automatic-speech-recognition", modelName, {
        device: "webgpu",
        dtype: "fp32",
        progress_callback: (info: any) => {
          self.postMessage({ type: "progress", info });
        },
      });
      self.postMessage({ type: "ready", device: "webgpu" });
      return transcriber;
    } catch (err: any) {
      self.postMessage({ type: "warn", message: "WebGPU failed, falling back to WASM", error: err?.message });
    }
  }

  activeDevice = "wasm";
  self.postMessage({ type: "status", status: "initializing", device: "wasm" });
  transcriber = await pipeline("automatic-speech-recognition", modelName, {
    device: "wasm",
    progress_callback: (info: any) => {
      self.postMessage({ type: "progress", info });
    },
  });
  self.postMessage({ type: "ready", device: "wasm" });
  return transcriber;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, audioData, id } = e.data;

  if (type === "init") {
    try {
      await initTranscriber();
    } catch (error: any) {
      self.postMessage({ type: "error", error: error?.message || "Failed to initialize Whisper model." });
    }
    return;
  }

  if (type === "transcribe") {
    try {
      const model = await initTranscriber();
      self.postMessage({ type: "transcribing", id });

      const float32Array = new Float32Array(audioData);
      const output = await model(float32Array, {
        language: "english",
        task: "transcribe",
        return_timestamps: false,
      });

      const text = Array.isArray(output)
        ? output.map((item) => item.text).join(" ")
        : output.text || "";

      self.postMessage({
        type: "result",
        id,
        text: text.trim(),
        device: activeDevice,
      });
    } catch (error: any) {
      self.postMessage({
        type: "error",
        id,
        error: error?.message || "Transcription failed.",
      });
    }
  }
};
