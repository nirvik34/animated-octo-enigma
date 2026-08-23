import { transcribeAudioBlobLocally, LocalWhisperProgress } from "./browser-whisper";

export interface TranscriberProgress {
  status: string;
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export function getActiveDevice(): "webgpu" | "wasm" | "cpu" {
  return "wasm";
}

export async function transcribeAudioClient(
  audioInput: Blob | Float32Array,
  onProgress?: (info: TranscriberProgress) => void
): Promise<string> {
  if (audioInput instanceof Blob) {
    return transcribeAudioBlobLocally(audioInput, (p: LocalWhisperProgress) => {
      if (onProgress) {
        onProgress({
          status: p.stage,
          progress: p.progress,
        });
      }
    });
  }
  return "";
}

