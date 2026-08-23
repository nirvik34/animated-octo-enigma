import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob | File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided in request." },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (openaiApiKey && openaiApiKey.trim() !== "") {
      try {
        const whisperFormData = new FormData();
        const fileToUpload = audioFile instanceof File
          ? audioFile
          : new File([audioFile], "recording.webm", { type: audioFile.type || "audio/webm" });

        whisperFormData.append("file", fileToUpload);
        whisperFormData.append("model", "whisper-1");
        whisperFormData.append("language", "en");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: whisperFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            text: data.text,
            engine: "OpenAI Whisper-1",
          });
        }
      } catch (err) {
        console.error("OpenAI Whisper API error:", err);
      }
    }

    if (groqApiKey && groqApiKey.trim() !== "") {
      try {
        const groqFormData = new FormData();
        const fileToUpload = audioFile instanceof File
          ? audioFile
          : new File([audioFile], "recording.webm", { type: audioFile.type || "audio/webm" });

        groqFormData.append("file", fileToUpload);
        groqFormData.append("model", "whisper-large-v3-turbo");

        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: groqFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            text: data.text,
            engine: "Groq Whisper-large-v3",
          });
        }
      } catch (err) {
        console.error("Groq Whisper API error:", err);
      }
    }

    return NextResponse.json(
      {
        error:
          "No server transcription API key configured (OPENAI_API_KEY or GROQ_API_KEY missing). Please use browser Speech Recognition (Live Voice Typing) or add API credentials.",
      },
      { status: 503 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Transcription Handler Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process audio recording." },
      { status: 500 }
    );
  }
}
