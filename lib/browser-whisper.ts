import { BrowserWhisper, TranscribeProgress, TranscriptSegment } from "browser-whisper";

export interface LocalWhisperProgress {
  stage: "loading" | "decoding" | "transcribing" | "done";
  progress: number;
  message?: string;
}

let whisperInstance: BrowserWhisper | null = null;

/**
 * Lazy singleton instance for BrowserWhisper using Whisper Tiny.
 */
export function getBrowserWhisperInstance(): BrowserWhisper {
  if (typeof window === "undefined") {
    throw new Error("BrowserWhisper can only be used in client-side browser environment.");
  }
  if (!whisperInstance) {
    whisperInstance = new BrowserWhisper({
      model: "whisper-tiny",
      language: "en",
    });
  }
  return whisperInstance;
}

/**
 * Transcribes an audio Blob locally in the browser using WASM/WebGPU and Web Workers.
 *
 * @param audioBlob Audio Blob recorded from MediaRecorder.
 * @param onProgress Callback function to monitor progress (downloading, decoding, transcribing).
 * @param onSegment Optional callback fired for each transcribed segment.
 * @returns Transcribed text string.
 */
export async function transcribeAudioBlobLocally(
  audioBlob: Blob,
  onProgress?: (progress: LocalWhisperProgress) => void,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<string> {
  if (!audioBlob || audioBlob.size === 0) {
    return "";
  }

  const mimeType = audioBlob.type || "audio/webm";
  const file = new File([audioBlob], "recorded_voice_note.webm", { type: mimeType });

  const whisper = getBrowserWhisperInstance();

  const stream = whisper.transcribe(file, {
    model: "whisper-tiny",
    language: "en",
    onProgress: (p: TranscribeProgress) => {
      if (onProgress) {
        let msg = "";
        switch (p.stage) {
          case "loading":
            msg = p.progress < 1
              ? `Downloading Whisper Tiny AI model (${Math.round(p.progress * 100)}%)...`
              : "Loading Whisper model into browser...";
            break;
          case "decoding":
            msg = "Decoding recorded voice note...";
            break;
          case "transcribing":
            msg = `Transcribing audio locally (${Math.round(p.progress * 100)}%)...`;
            break;
          case "done":
            msg = "Transcription complete!";
            break;
        }

        onProgress({
          stage: p.stage,
          progress: p.progress,
          message: msg,
        });
      }
    },
    onSegment: (segment: TranscriptSegment) => {
      if (onSegment) {
        onSegment(segment);
      }
    },
  });

  const segments = await stream.collect();
  const fullText = segments.map((s) => s.text).join(" ").trim();
  return fullText;
}
