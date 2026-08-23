"use client";

import { pipeline, env } from "@huggingface/transformers";

// Disable local model downloading checks for HuggingFace CDN caching
env.allowLocalModels = false;

export interface TranscriberProgress {
  status: string;
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

let transcriberPromise: Promise<any> | null = null;
let activeDevice: "webgpu" | "wasm" | "cpu" = "wasm";

/**
 * Check if WebGPU is supported in the current browser environment.
 */
export async function isWebGPUSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !("gpu" in navigator) || !(navigator as any).gpu) {
    return false;
  }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

/**
 * Get or initialize the singleton Whisper transcriber pipeline.
 * Tries WebGPU first when supported, falling back automatically to WASM/CPU.
 */
export async function getWhisperTranscriber(
  onProgress?: (info: TranscriberProgress) => void
): Promise<any> {
  if (transcriberPromise) {
    return transcriberPromise;
  }

  transcriberPromise = (async () => {
    const webGpuAvailable = await isWebGPUSupported();
    const modelName = "onnx-community/whisper-tiny.en";

    if (webGpuAvailable) {
      try {
        console.log("⚡ Initializing Transformers.js Whisper with WebGPU acceleration...");
        activeDevice = "webgpu";
        const transcriber = await pipeline("automatic-speech-recognition", modelName, {
          device: "webgpu",
          dtype: "fp32",
          progress_callback: (info: any) => {
            if (onProgress && info) onProgress(info);
          },
        });
        console.log("✅ Whisper pipeline initialized with WebGPU.");
        return transcriber;
      } catch (err) {
        console.warn("⚠️ WebGPU Whisper initialization failed, falling back to WASM:", err);
      }
    }

    console.log("📦 Initializing Transformers.js Whisper with WASM/CPU fallback...");
    activeDevice = "wasm";
    const transcriber = await pipeline("automatic-speech-recognition", modelName, {
      device: "wasm",
      progress_callback: (info: any) => {
        if (onProgress && info) onProgress(info);
      },
    });
    console.log("✅ Whisper pipeline initialized with WASM.");
    return transcriber;
  })().catch((err) => {
    transcriberPromise = null;
    throw err;
  });

  return transcriberPromise;
}

export function getActiveDevice(): "webgpu" | "wasm" | "cpu" {
  return activeDevice;
}

/**
 * Convert an Audio Blob (webm/wav/mp4) into 16kHz mono Float32Array for Whisper model input.
 */
export async function audioBlobTo16kHzFloat32(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass({ sampleRate: 16000 });

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    return audioBuffer.getChannelData(0);
  } finally {
    await audioContext.close().catch(() => {});
  }
}

/**
 * Transcribe a Float32Array or Audio Blob using local client-side Whisper.
 */
export async function transcribeAudioClient(
  audioInput: Blob | Float32Array,
  onProgress?: (info: TranscriberProgress) => void
): Promise<string> {
  const transcriber = await getWhisperTranscriber(onProgress);

  let pcmData: Float32Array;
  if (audioInput instanceof Blob) {
    pcmData = await audioBlobTo16kHzFloat32(audioInput);
  } else {
    pcmData = audioInput;
  }

  if (!pcmData || pcmData.length === 0) {
    return "";
  }

  const output = await transcriber(pcmData, {
    language: "english",
    task: "transcribe",
    return_timestamps: false,
  });

  const text = Array.isArray(output)
    ? output.map((item) => item.text).join(" ")
    : output.text || "";

  return text.trim();
}
