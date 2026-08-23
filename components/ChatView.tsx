"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  Square,
  Download,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  MapPin,
  Wrench,
  Volume2,
  Loader2,
  Menu,
  FileText,
  Clock,
  Trash2,
  Zap,
} from "lucide-react";
import { ChatMessage, InputType } from "@/types/chat";
import { SiteInspection, getInspectionRecordStatus } from "@/types/inspection";
import { InspectionRecordItem } from "@/lib/sample-records";
import { transcribeAudioBlobLocally } from "@/lib/browser-whisper";

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, inputType?: InputType) => void;
  loading: boolean;
  onOpenModal: (inspection: SiteInspection) => void;
  showToast: (msg: string) => void;
  onOpenMobileSidebar?: () => void;
  records?: InspectionRecordItem[];
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start(): void;
  stop(): void;
}

export default function ChatView({
  messages,
  onSendMessage,
  loading,
  onOpenModal,
  showToast,
  onOpenMobileSidebar,
  records = [],
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
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechRecognitionTextRef = useRef<string>("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isRecordingVoice) {
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
        } catch {
        }
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
      const windowObj = window as unknown as Record<string, unknown>;
      const SpeechRecognitionClass = (windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition) as
        | (new () => SpeechRecognitionLike)
        | undefined;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: SpeechRecognitionEventLike) => {
            let currentTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript + " ";
            }
            speechRecognitionTextRef.current = currentTranscript.trim();
          };

          recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
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
        setTranscriptionStatus("Processing audio note...");
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          let transcript = speechRecognitionTextRef.current.trim();

          if (!transcript) {
            setTranscriptionStatus("Transcribing audio...");
            try {
              transcript = await transcribeAudioBlobLocally(audioBlob, (prog) => {
                setTranscriptionStatus(prog.message || "Transcribing audio locally...");
              });
            } catch (localErr: unknown) {
              console.warn("Local whisper transcription failed, falling back to server API:", localErr);
              setTranscriptionStatus("Transcribing via server...");

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
            showToast("Audio transcribed. Click 'Extract Record' to process.");
          } else {
            showToast("No speech detected in recorded audio.");
          }
        } catch (err: unknown) {
          console.error("Transcription error:", err);
          const msg = err instanceof Error ? err.message : String(err);
          showToast(`Transcription error: ${msg}`);
        } finally {
          setIsTranscribing(false);
          setTranscriptionStatus("");
        }
      };

      mediaRecorder.start(200);
      setRecordingSeconds(0);
      setIsRecordingVoice(true);
      showToast("Recording voice note...");
    } catch (err: unknown) {
      console.error("Failed to access microphone:", err);
      showToast("Microphone access denied. Please check browser permissions.");
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
      } catch {
      }
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
    if (!dateStr) return "N/A";
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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return (
          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-semibold">
            Critical Urgency
          </span>
        );
      case "high":
        return (
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-semibold">
            High Urgency
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[11px] font-semibold">
            Medium Urgency
          </span>
        );
      case "low":
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[11px] font-medium">
            Low Urgency
          </span>
        );
    }
  };

  const isEmptyState = messages.length === 0 && records.length === 0;

  const headerBlock = (
    <div className="space-y-1">
      <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
        New inspection
      </h1>
      <p className="text-sm text-neutral-500">
        Start with notes, an email, or a voice memo.
      </p>
    </div>
  );

  const inputCard = (
  <div className="bg-white border border-neutral-300 rounded-xl p-4 shadow-2xs space-y-3">
    {isRecordingVoice && (
      <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-xs font-semibold text-red-900">
            Recording voice note ({recordingSeconds}s)...
          </span>
        </div>
        <button
          type="button"
          onClick={stopRecording}
          className="text-xs font-medium px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Stop</span>
        </button>
      </div>
    )}

    {isTranscribing && (
      <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center gap-2.5">
        <Loader2 className="w-4 h-4 text-neutral-700 animate-spin shrink-0" />
        <span className="text-xs font-medium text-neutral-800">
          {transcriptionStatus || "Processing voice note..."}
        </span>
      </div>
    )}

    <textarea
      value={inputText}
      onChange={(e) => setInputText(e.target.value)}
      onKeyDown={handleKeyDown}
      rows={5}
      disabled={isTranscribing}
      placeholder="Paste inspection notes..."
      className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none resize-none leading-relaxed"
    />

    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleVoiceRecording}
          disabled={isTranscribing}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            isRecordingVoice
              ? "bg-red-600 text-white"
              : isTranscribing
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          {isRecordingVoice ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : isTranscribing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-neutral-600" />
          )}
          <span>
            {isRecordingVoice
              ? `Stop (${recordingSeconds}s)`
              : isTranscribing
              ? "Transcribing..."
              : "Record Voice Memo"}
          </span>
        </button>

        {inputText.trim() && (
          <button
            type="button"
            onClick={() => setInputText("")}
            className="px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={loading || isTranscribing || !inputText.trim()}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
          loading || isTranscribing || !inputText.trim()
            ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            : "bg-black text-white hover:bg-neutral-800"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Extracting...</span>
          </>
        ) : (
          <>
            <span>Extract Record</span>
            <Send className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfcfc] font-sans min-h-0">
      {onOpenMobileSidebar && (
        <div className="md:hidden px-4 py-3 border-b border-neutral-200 bg-white flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenMobileSidebar}
            className="p-1.5 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-neutral-900">New inspection</span>
        </div>
      )}

      {isEmptyState ? (
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex items-center">
            <div className="max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
              {headerBlock}
              {inputCard}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
            {messages.length > 0 && (
              <div className="space-y-4 pt-2">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Current Session Results
                </h2>

                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="space-y-3">
                      {msg.sender === "user" ? (
                        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3.5 text-xs text-neutral-800 space-y-1">
                          <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-500">
                            {msg.inputType === "voice" ? (
                              <span className="flex items-center gap-1 text-amber-700">
                                <Volume2 className="w-3 h-3" /> Voice Note Transcript
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Raw Inspection Input
                              </span>
                            )}
                            <span>•</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4 shadow-2xs">
                          {msg.parsedData ? (
                            <>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {(() => {
                                      const { status: recordStatus, missingFields } = getInspectionRecordStatus(msg.parsedData);
                                      if (recordStatus === "dispatched") {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-semibold">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Dispatched
                                          </span>
                                        );
                                      }
                                      if (recordStatus === "ready") {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Ready
                                          </span>
                                        );
                                      }
                                      return (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-semibold">
                                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                                          Needs review ({missingFields.length} missing)
                                        </span>
                                      );
                                    })()}
                                    {getUrgencyBadge(msg.parsedData.urgencyLevel)}
                                    {msg.executionMs !== undefined && (
                                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-semibold inline-flex items-center gap-1">
                                        <Zap className="w-3 h-3 text-purple-600 fill-purple-600" />
                                        <span>
                                          {msg.provider ? `${msg.provider}` : "Auto"} ({msg.executionMs}ms)
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-base font-bold text-neutral-900 mt-1">
                                    {msg.parsedData.clientName || "Client name not detected"}
                                  </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onOpenModal(msg.parsedData!)}
                                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-800 hover:bg-neutral-50"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>View Card</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownloadJsonFile(msg.parsedData!)}
                                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>JSON</span>
                                  </button>
                                </div>
                              </div>

                              {msg.warning && (
                                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>{msg.warning}</span>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-700">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                                  <span className="truncate">
                                    {msg.parsedData.siteAddress || "Address not specified"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                                  <span>Date: {formatDateHuman(msg.parsedData.inspectionDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold text-neutral-900">
                                  <DollarSign className="w-4 h-4 text-neutral-400 shrink-0" />
                                  <span>
                                    Est. Budget:{" "}
                                    {msg.parsedData.budgetEstimate
                                      ? `${msg.parsedData.currency === 'USD' ? '₹' : msg.parsedData.currency} ${msg.parsedData.budgetEstimate.toLocaleString()}`
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>

                              {msg.parsedData.equipmentNotes.length > 0 && (
                                <div className="pt-3 border-t border-neutral-100 space-y-2">
                                  <span className="text-xs font-semibold text-neutral-600">
                                    Equipment & Infrastructure ({msg.parsedData.equipmentNotes.length})
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {msg.parsedData.equipmentNotes.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs px-2.5 py-1 rounded border border-neutral-200 bg-neutral-50 flex items-center gap-1.5 text-neutral-800"
                                      >
                                        <Wrench className="w-3 h-3 text-neutral-400" />
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-[11px] text-neutral-500 capitalize">
                                          ({item.status})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  onClick={() => handleCopyJsonPayload(msg.parsedData!)}
                                  className="text-xs text-neutral-500 hover:text-black flex items-center gap-1 font-medium"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy JSON Payload</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-neutral-700">{msg.text}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {records.length > 0 && messages.length === 0 && (
              <div className="space-y-3 pt-4">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent Inspection Records</span>
                </h2>

                <div className="space-y-2">
                  {records.slice(0, 4).map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => onOpenModal(rec.data)}
                      className="p-3.5 bg-white border border-neutral-200 hover:border-neutral-400 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-neutral-900">
                          {rec.data.clientName || "Unspecified Client"}
                        </div>
                        <div className="text-neutral-500 truncate max-w-lg">
                          {rec.data.siteAddress || rec.sourceText}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-neutral-400">
                          {rec.data.inspectionDate || "Recent"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenModal(rec.data);
                          }}
                          className="text-xs font-medium text-neutral-700 hover:text-black border border-neutral-200 px-2.5 py-1 rounded bg-neutral-50"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="shrink-0 border-t border-neutral-200 bg-[#fcfcfc]">
            <div className="max-w-4xl w-full mx-auto px-4 py-4 sm:px-8">
              {inputCard}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
