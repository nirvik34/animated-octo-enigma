"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Building,
  Calendar,
  DollarSign,
  MapPin,
  Wrench,
  ShieldAlert,
  Zap,
  Volume2
} from "lucide-react";
import { ChatMessage, InputType } from "@/types/chat";
import { SiteInspection, EquipmentNote } from "@/types/inspection";
import { ProviderType } from "@/lib/llm-provider";

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, inputType?: InputType) => void;
  loading: boolean;
  provider: ProviderType;
  onOpenModal: (inspection: SiteInspection) => void;
  showToast: (msg: string) => void;
}

const PRESET_NOTE_1 = `URGENT SITE INSPECTION REPORT
Client: Apex Manufacturing Solutions
Site Location: 1040 Industrial Parkway, Building B, Austin, TX 78758
Date: 2026-08-21
Inspector: Marcus Vance (Senior Field Tech)

Summary:
Conducted quarterly walkthrough of primary utility corridors and mechanical room. Found multiple equipment issues requiring immediate attention before next production shift.

Key Issues & Observations:
* Chiller Unit #3 showing heavy vibration in primary bearing housing. Coolant pressure is currently 18 PSI (normal threshold 32 PSI). Needs technician review.
* Main Transformer Substation thermal sweep clean. No hotspots recorded on infrared camera. Unit is fully operational.
* Backup Diesel Generator failed automatic transfer switch test during simulated outage. Fuel line showing severe rust and corrosion. Recommend immediate replacement.
* Water pooling observed near South Loading Bay electrical sub-panel due to blocked exterior storm drain.
* Fire suppression pressure gauge reading 15% below operational minimum.
* Vibration isolators on air handler units worn beyond recommended tolerance.

Financial & Scheduling:
Estimated total repair and maintenance budget: $24,500 USD.
Urgency: HIGH. Action required within 48 hours.

Next Steps:
1. Issue urgent work order for Backup Generator transfer switch replacement.
2. Schedule HVAC technician to flush and repair Chiller Unit #3 bearing.
3. Notify facility manager regarding South Bay drainage clearing.`;

const PRESET_NOTE_2 = `CRITICAL HAZARD FIELD REPORT
Client: Gulf Coast Petrochemical Tank Farm #4
Site: 8800 Maritime Highway, Dock 12, Freeport, TX 77541
Inspection Date: 2026-08-20
Estimated Budget: $68,000 USD

Field Findings:
Emergency inspection triggered by pressure drop alarm on Main Storage Tank #12 pipeline header.
* Main Storage Tank #12 relief valve weeping volatile organic vapors into secondary containment zone. Valve seal compromised. STATUS: REPLACE IMMEDIATELY.
* Secondary Containment Berm wall #3 has 2-inch structural fracture near east drainage valve. Water tight integrity lost. STATUS: NEEDS REPAIR.
* Emergency Shutdown System (ESD) loop tested successful across all 4 remote stations. STATUS: OPERATIONAL.
* Gas detection sensor grid calibrated successfully with zero drift. STATUS: OPERATIONAL.

Observations:
- Containment wall fracture poses environmental compliance risk if heavy rainfall occurs.
- Replacement 4-inch ANSI relief valve is available in regional warehouse stock.

Urgency: CRITICAL. Shutdown zone established.
Action Items:
- Dispatch pipefitting crew for emergency relief valve swap out today.
- Inject epoxy sealant into berm fracture and reinforce with outer buttress.
- File Tier II environmental incident log with regional safety officer.`;

const PRESET_NOTE_3 = `ROUTINE PREMISES AUDIT
Client: Skyline Commercial Tower A
Address: 450 North Michigan Avenue, Chicago, IL 60611
Date: 2026-08-19
Budget: $4,200 USD
Urgency: LOW

Details:
Standard bi-monthly physical facility audit.
* Elevator Bank B (Units 1-4) operating within smooth acceleration parameters. Annual certification valid through Nov 2026. STATUS: OPERATIONAL.
* Roof Top Air Handler #2 belt tension loose, slight squeal on start-up. STATUS: NEEDS REPAIR.
* Fire Extinguishers Level 14-22 fully charged and tag dates updated. STATUS: OPERATIONAL.

Notes:
- Overall facility cleanliness excellent.
- Recommended preventive maintenance check for AHU #2 during upcoming weekend window.`;

export default function ChatView({
  messages,
  onSendMessage,
  loading,
  provider,
  onOpenModal,
  showToast,
}: ChatViewProps) {
  const [inputText, setInputText] = useState<string>("");
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim(), isRecordingVoice ? "voice" : "text");
    setInputText("");
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      // Stop voice recording and simulate spoken audio transcript
      setIsRecordingVoice(false);
      const simulatedVoiceText = `Voice Note Memo (Audio Recording 0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}):
Client: Western Pipeline Substation #7
Location: 440 Route 99, Midland, TX
Date: 2026-08-23
Inspection findings: Primary oil pump showing weeping seal near flange. Main breaker housing operational. Thermal camera sweep normal.
Budget estimate: $12,500 USD.
Urgency: HIGH. Action: Schedule seal replacement within 24 hours.`;
      setInputText(simulatedVoiceText);
      showToast("Voice note transcribed into field text!");
    } else {
      setIsRecordingVoice(true);
      showToast("Recording voice note... Click again to finish.");
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
              Recording Voice Note ({recordingSeconds}s)... Speak field inspection notes clearly.
            </span>
          </div>
          <button
            onClick={toggleVoiceRecording}
            className="text-xs font-bold px-3 py-1 rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            Stop & Transcribe
          </button>
        </div>
      )}

      <div className="relative bg-white border border-neutral-300 shadow-sm rounded-2xl p-3 focus-within:ring-2 focus-within:ring-black focus-within:border-black transition-all">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={centered ? 4 : 3}
          placeholder="Type or paste unstructured site inspection text, voice transcriptions, email reports..."
          className="w-full bg-transparent p-1.5 text-sm sm:text-base font-mono leading-relaxed text-neutral-900 placeholder:text-neutral-400 outline-none resize-none"
        />

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isRecordingVoice
                  ? "bg-red-600 text-white animate-bounce"
                  : "bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200"
              }`}
              title="Record Voice Memo"
            >
              <Mic className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">
                {isRecordingVoice ? "Stop Recording" : "Voice Memo"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={loading || !inputText.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                loading || !inputText.trim()
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
      
      {/* Top Bar Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neutral-900 text-white">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-[#0b0b0b] tracking-tight">AI Inspection Assistant</h1>
            <p className="text-[11px] text-neutral-500">Unstructured Text & Voice Notes to Structured Schema</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700">
            Provider: <strong className="text-black uppercase">{provider}</strong>
          </span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-8 space-y-8 animate-in fade-in duration-300 text-center">
            {/* Quote Header */}
            <div className="space-y-3 px-4">
              <blockquote className="text-lg sm:text-xl italic font-serif text-neutral-800 leading-relaxed">
                “Transforming unstructured chaos into operational clarity.”
              </blockquote>
              <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                Saniti AI Extraction Engine
              </p>
            </div>

            {/* Centered Text Box */}
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
                  
                  {/* Assistant Header & Execution Telemetry */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-md ${msg.fallbackUsed ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                        <CheckCircle2 className={`w-4 h-4 ${msg.fallbackUsed ? "text-amber-600" : "text-emerald-600"}`} />
                      </span>
                      <span className="text-xs font-bold text-neutral-900">
                        {msg.fallbackUsed ? "Extraction Completed (Fallback Engine)" : "Extraction Completed"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.fallbackUsed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium flex items-center gap-1" title={msg.warning || "Fallback engine used"}>
                          <Zap className="w-3 h-3 text-amber-600" />
                          Fallback Engine Used
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-mono">
                          {msg.provider?.toUpperCase()} ({msg.modelName})
                        </span>
                      )}
                    </div>
                  </div>

                  {msg.warning && msg.fallbackUsed && (
                    <div className="px-3 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/70 text-amber-900 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{msg.warning}</span>
                    </div>
                  )}

                  {/* Extraction Summary Item Card in Chat */}
                  {msg.parsedData && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-4">
                      
                      {/* Top Bar of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Client Record</span>
                            {getUrgencyBadge(msg.parsedData.urgencyLevel, msg.fallbackUsed)}
                          </div>
                          <h3 className="text-base font-extrabold text-neutral-900 mt-0.5">
                            {msg.parsedData.clientName || <span className="text-neutral-400 font-normal italic">Client information unavailable</span>}
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

                      {/* Summary Data Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span className="truncate">{msg.parsedData.siteAddress || <span className="text-neutral-400 italic">Address not provided</span>}</span>
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

                      {/* Equipment Summary List Pills */}
                      <div className="pt-2 border-t border-neutral-200/60 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-neutral-500 uppercase">Equipment Extracted:</span>
                        {msg.parsedData.equipmentNotes.length === 0 ? (
                          <span className="text-xs text-neutral-400 italic">No equipment issues detected</span>
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

                  {/* Actions Bar */}
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

      {/* Input Chat Area - only shown at bottom when messages exist */}
      {messages.length > 0 && (
        <div className="p-4 border-t border-neutral-200 bg-white shrink-0 shadow-lg">
          {renderInputBox(false)}
        </div>
      )}
    </div>
  );
}
