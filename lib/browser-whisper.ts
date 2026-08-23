import { BrowserWhisper, TranscribeProgress, TranscriptSegment } from "browser-whisper";

export interface LocalWhisperProgress {
  stage: "loading" | "decoding" | "transcribing" | "done";
  progress: number;
  message?: string;
}

let whisperInstance: BrowserWhisper | null = null;

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

  const fileProgressMap = new Map<string, number>();
  let maxReportedLoadingProgress = 0;

  const stream = whisper.transcribe(file, {
    model: "whisper-tiny",
    language: "en",
    onProgress: (p: TranscribeProgress) => {
      if (onProgress) {
        let msg = "";
        let effectiveProgress = p.progress;

        switch (p.stage) {
          case "loading": {
            const fileName = (p as any).file || (p as any).name || "model_component";
            fileProgressMap.set(fileName, p.progress);

            let sum = 0;
            fileProgressMap.forEach((val) => {
              sum += val;
            });
            const avgProgress = fileProgressMap.size > 0 ? sum / fileProgressMap.size : p.progress;

            maxReportedLoadingProgress = Math.max(maxReportedLoadingProgress, avgProgress);
            effectiveProgress = maxReportedLoadingProgress;

            const percentage = Math.min(Math.round(effectiveProgress * 100), 100);
            if (percentage >= 99) {
              msg = "Initializing Whisper AI model in browser memory...";
            } else {
              msg = `Downloading Whisper AI Model (${percentage}%)...`;
            }
            break;
          }
          case "decoding":
            msg = "Decoding recorded voice note...";
            break;
          case "transcribing": {
            const percentage = Math.round(p.progress * 100);
            msg = `Transcribing audio locally (${percentage}%)...`;
            break;
          }
          case "done":
            msg = "Transcription complete!";
            break;
        }

        onProgress({
          stage: p.stage,
          progress: effectiveProgress,
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

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Local Whisper model loading timed out after 20 seconds. Falling back to server API."));
    }, 20000);
  });

  const segments = await Promise.race([stream.collect(), timeoutPromise]);
  const fullText = segments.map((s) => s.text).join(" ").trim();
  return fullText;
}


