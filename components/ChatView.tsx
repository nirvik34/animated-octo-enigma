"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  Square,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  MapPin,
  Wrench,
  Volume2,
  Loader2,
  Zap,
  Menu,
} from "lucide-react";
import { ChatMessage, InputType } from "@/types/chat";
import { SiteInspection } from "@/types/inspection";
import { transcribeAudioBlobLocally } from "@/lib/browser-whisper";

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, inputType?: InputType) => void;
  loading: boolean;
  onOpenModal: (inspection: SiteInspection) => void;
  showToast: (msg: string) => void;
  onOpenMobileSidebar?: () => void;
}

export default function ChatView({
  messages,
  onSendMessage,
  loading,
  onOpenModal,
  showToast,
  onOpenMobileSidebar,
}: ChatViewProps) {
  const [inputText, setInputText] = useState<string>("");
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>("");
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [wasRecordedNote, setWasRecordedNote] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechRecognitionTextRef = useRef<string>("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecordingVoice]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      showToast("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      speechRecognitionTextRef.current = "";
      const SpeechRecognition =
        typeof window !== "undefined"
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            let currentTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript + " ";
            }
            speechRecognitionTextRef.current = currentTranscript.trim();
          };

          recognition.onerror = (event: any) => {
            console.warn("SpeechRecognition error:", event.error);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition initialization error:", e);
        }
      }

      let options = {};
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/webm;codecs=opus" };
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioBlob.size === 0) {
          showToast("Recording was empty.");
          return;
        }

        setIsTranscribing(true);
        setTranscriptionStatus("Processing recorded audio...");
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          let transcript = speechRecognitionTextRef.current.trim();

          if (!transcript) {
            setTranscriptionStatus("Initializing Local Whisper AI...");
            try {
              transcript = await transcribeAudioBlobLocally(audioBlob, (prog) => {
                setTranscriptionStatus(prog.message || "Transcribing audio locally...");
              });
            } catch (localErr: any) {
              console.warn("Local whisper transcription failed, falling back to server API:", localErr);
              setTranscriptionStatus("Falling back to server transcription...");

              const formData = new FormData();
              formData.append("file", audioBlob, "recording.webm");
              const res = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
              });

              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Server transcription failed.");
              }

              const data = await res.json();
              transcript = data.text || "";
            }
          }

          if (transcript.trim()) {
            setInputText((prev) => (prev.trim() ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
            setWasRecordedNote(true);
            showToast("Audio transcribed! Review your text and click 'Extract Record' to send.");
          } else {
            showToast("No speech detected in recorded audio.");
          }
        } catch (err: any) {
          console.error("Transcription error:", err);
          showToast(`Transcription error: ${err.message || err}`);
        } finally {
          setIsTranscribing(false);
          setTranscriptionStatus("");
        }
      };

      mediaRecorder.start(200);
      setIsRecordingVoice(true);
      showToast("Recording audio note... Speak clearly into your microphone.");
    } catch (err: any) {
      console.error("Failed to access microphone:", err);
      showToast("Microphone access denied. Please allow microphone access in browser settings.");
    }
  };

  const stopRecording = () => {
    setIsRecordingVoice(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleVoiceRecording = () => {
    if (isTranscribing) return;
    if (isRecordingVoice) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || loading || isTranscribing) return;
    if (isRecordingVoice) {
      stopRecording();
    }
    onSendMessage(inputText.trim(), wasRecordedNote ? "voice" : "text");
    setInputText("");
    setWasRecordedNote(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownloadJsonFile = (inspection: SiteInspection) => {
    const filename = `site-inspection-${(inspection.clientName || "record")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}.json`;
    const blob = new Blob([JSON.stringify(inspection, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  const handleCopyJsonPayload = (inspection: SiteInspection) => {
    navigator.clipboard.writeText(JSON.stringify(inspection, null, 2));
    showToast("JSON payload copied to clipboard");
  };

  const formatDateHuman = (dateStr?: string): string => {
    if (!dateStr) return "Date unavailable";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getUrgencyBadge = (urgency: string, isFallback?: boolean) => {
    const labelSuffix = isFallback ? " (Inferred)" : "";
    switch (urgency?.toLowerCase()) {
      case "critical":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
            Critical{labelSuffix}
          </span>
        );
      case "high":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider">
            High{labelSuffix}
          </span>
        );
      case "medium":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
            Medium{labelSuffix}
          </span>
        );
      case "low":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-[10px] font-medium uppercase tracking-wider">
            Low{labelSuffix}
          </span>
        );
    }
  };

  const renderInputBox = (centered = false) => (
    <div className={`space-y-3 ${centered ? "w-full max-w-2xl" : "max-w-4xl mx-auto"}`}>
      {isRecordingVoice && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-bold text-red-900">
              Recording Voice Note ({recordingSeconds}s)... Click 'Stop Recording' when finished.
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-sm flex items-center gap-1.5"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop Recording</span>
          </button>
        </div>
      )}

      {isTranscribing && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
          <span className="text-xs font-bold text-emerald-900">
            {transcriptionStatus || "Transcribing audio note..."}
          </span>
        </div>
      )}

      <div className="relative bg-white border border-neutral-300 shadow-sm rounded-2xl p-3 focus-within:ring-2 focus-within:ring-black focus-within:border-black transition-all">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={centered ? 4 : 3}
          disabled={isTranscribing}
          placeholder="Type or paste site inspection details, or click 'Record Audio' to record a voice note..."
          className="w-full bg-transparent p-1.5 text-sm sm:text-base font-mono leading-relaxed text-neutral-900 placeholder:text-neutral-400 outline-none resize-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceRecording}
              disabled={isTranscribing}
              className={`p-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isRecordingVoice
                  ? "bg-red-600 text-white animate-pulse"
                  : isTranscribing
                  ? "bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200"
              }`}
              title="Record an audio note, transcribe it locally, and review before sending"
            >
              {isRecordingVoice ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : isTranscribing ? (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              ) : (
                <Mic className="w-4 h-4 text-red-500" />
              )}
              <span className="hidden sm:inline">
                {isRecordingVoice
                  ? `Stop Recording (${recordingSeconds}s)`
                  : isTranscribing
                  ? "Transcribing..."
                  : "Record Audio"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={loading || isTranscribing || !inputText.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                loading || isTranscribing || !inputText.trim()
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-neutral-800 shadow-md active:scale-95"
              }`}
            >
              <span>Extract Record</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfcfc] overflow-hidden">
      {onOpenMobileSidebar && (
        <div className="md:hidden px-4 py-3 border-b border-neutral-200 bg-white flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-all"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-neutral-900">Saniti AI</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-8 space-y-8 animate-in fade-in duration-300 text-center">
            <div className="space-y-3 px-4">
              <blockquote className="text-lg sm:text-xl italic font-serif text-neutral-800 leading-relaxed">
                “Transforming unstructured chaos into operational clarity.”
              </blockquote>
            </div>

            {renderInputBox(true)}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              } space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {msg.sender === "user" ? "Field Inspector / User" : "Saniti AI Assistant"}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">{msg.timestamp}</span>
              </div>

              {msg.sender === "user" ? (
                <div className="max-w-2xl bg-neutral-900 text-white rounded-2xl rounded-tr-none px-5 py-3.5 text-xs leading-relaxed space-y-2 shadow-sm">
                  {msg.inputType === "voice" && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-neutral-800 pb-1">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Transcribed Voice Note</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap font-mono">{msg.text}</p>
                </div>
              ) : (
                <div className="max-w-3xl w-full bg-white border border-neutral-200 rounded-2xl rounded-tl-none p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-md ${msg.fallbackUsed ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                        {msg.fallbackUsed ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </span>
                      <span className="text-xs font-extrabold text-neutral-900">
                        {msg.fallbackUsed ? "AI Extraction Failed (Fast Fallback Applied)" : "AI Extraction Completed"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.fallbackUsed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold flex items-center gap-1" title={msg.warning || "Fallback engine used"}>
                          <Zap className="w-3 h-3 text-amber-600" />
                          Fast Rule-Based Fallback
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-mono">
                          {msg.provider?.toUpperCase()} ({msg.modelName})
                        </span>
                      )}
                    </div>
                  </div>

                  {msg.warning && msg.fallbackUsed && (
                    <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-amber-950">AI Model Timeout / Unreachable</p>
                        <p className="text-[11px] text-amber-800 leading-snug">{msg.warning}</p>
                      </div>
                    </div>
                  )}

                  {msg.parsedData && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Client Record</span>
                            {getUrgencyBadge(msg.parsedData.urgencyLevel, msg.fallbackUsed)}
                          </div>
                          <h3 className="text-base font-extrabold text-neutral-900 mt-0.5">
                            {!msg.parsedData.clientName || msg.parsedData.clientName === "Client name not detected" || msg.parsedData.clientName === "Unknown Client" ? (
                              <span className="text-amber-800/80 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium italic border border-amber-200/60 inline-flex items-center gap-1">
                                Client name not detected
                              </span>
                            ) : (
                              msg.parsedData.clientName
                            )}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenModal(msg.parsedData!)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-100 transition-colors shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => handleDownloadJsonFile(msg.parsedData!)}
                            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download JSON</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span className="truncate">
                            {!msg.parsedData.siteAddress || msg.parsedData.siteAddress === "Address not detected" || msg.parsedData.siteAddress === "Address Not Provided" ? (
                              <span className="text-neutral-400 italic">Address not detected</span>
                            ) : (
                              msg.parsedData.siteAddress
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-neutral-700">
                          <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span>Date: {formatDateHuman(msg.parsedData.inspectionDate)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-neutral-700 font-semibold">
                          <DollarSign className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span>
                            Est. Budget: {msg.parsedData.budgetEstimate ? `${msg.parsedData.currency} ${msg.parsedData.budgetEstimate.toLocaleString()}` : <span className="text-neutral-400 font-normal italic">Not specified</span>}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-200/60 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-neutral-500 uppercase">Equipment Extracted:</span>
                        {msg.parsedData.equipmentNotes.length === 0 ? (
                          <span className="text-xs text-neutral-400 italic flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-neutral-300" />
                            No equipment items detected
                          </span>
                        ) : (
                          msg.parsedData.equipmentNotes.map((item, idx) => (
                            <span
                              key={idx}
                              className={`text-[11px] font-medium px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                                item.status === "replace"
                                  ? "bg-red-50 text-red-800 border-red-200 font-bold"
                                  : item.status === "needs_repair"
                                  ? "bg-amber-50 text-amber-900 border-amber-200 font-bold"
                                  : "bg-white text-neutral-700 border-neutral-200"
                              }`}
                            >
                              <Wrench className="w-3 h-3 text-neutral-500" />
                              <span>{item.name}</span>
                              <span className="opacity-60 font-mono">({item.status})</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {msg.parsedData && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => handleCopyJsonPayload(msg.parsedData!)}
                        className="text-neutral-500 hover:text-black font-semibold flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON Payload</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-neutral-200 max-w-md shadow-sm animate-pulse">
            <RefreshCw className="w-4 h-4 text-neutral-800 animate-spin" />
            <span className="text-xs font-semibold text-neutral-700">
              Extracting structured inspection fields...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && (
        <div className="p-4 border-t border-neutral-200 bg-white shrink-0 shadow-lg">
          {renderInputBox(false)}
        </div>
      )}
    </div>
  );
}
