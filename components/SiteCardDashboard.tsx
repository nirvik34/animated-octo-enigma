"use client";

import React, { useState } from "react";
import {
  SiteInspection,
  EquipmentNote,
  UrgencyLevel,
  EquipmentStatus,
  DEFAULT_SITE_INSPECTION,
} from "@/types/inspection";
import { ProviderType } from "@/lib/llm-provider";
import {
  Sparkles,
  Copy,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Wrench,
  FileText,
  ListChecks,
  Loader2,
  ShieldAlert,
  Info,
  Mic,
  Mail,
  Zap,
  Check,
  Palette,
  BookOpen,
  X,
  Sliders,
} from "lucide-react";

type PaletteFamily = "earthy" | "jewel" | "minimalist";

const SAMPLE_PRESETS = [
  {
    id: "preset-voice",
    title: "Voice Memo Transcript",
    icon: Mic,
    badge: "Audio Log",
    text: `[00:00:04] Uh hey team, audio log for the site walk at BioTech Labs over at 550 Technology Square, Cambridge MA. Today's date is August 21 2026. Client name is BioTech Research Inc. We checked out the cleanroom HVAC system. The main condenser unit #2 is leaking refrigerant and vibrating real bad, definitely needs repair ASAP. Est cost maybe 8500 USD. The emergency diesel backup power generator is running great, passed full load test. Also noticed water stains on ceiling tiles near Server Room B, looks like a pipe sweat issue. Fire extinguishers in Hallway 4 are past inspection expiration date. Next steps: get an HVAC tech out here by Friday, order replacement ceiling tiles, and schedule fire compliance check. Urgency is high because of cleanroom temperature drift risk.`,
  },
  {
    id: "preset-email",
    title: "Messy Contractor Email",
    icon: Mail,
    badge: "Field Email",
    text: `From: contractor_dave@fieldworks.io
Subject: Fwd: Site Audit Notes - Apex Warehouse #4

Hey Sarah,
Here are my scribbled notes from the site visit at Apex Logistics Hub, 1800 Freight Terminal Way, Dallas TX.
Client: Apex Supply Chain Solutions.
Date: 2026-08-20

Budget for repairs: Rough estimate around $35,000 USD.

Equipment status:
- Overhead Crane #1: Operational, looks freshly serviced.
- Loading Bay Door 4 Hydraulic Pump: Completely seized up, needs total replacement. Dangerous condition!
- Automated Conveyor Belt B: Operational but squeaking.

Observations:
* Floor coating near Bay 2 peeling off creating trip hazard
* Structural steel column C-4 has minor forklift impact scrape, non-structural
* Main breaker panel room lacks proper arc flash warning signage

Urgency level: High - loading bay 4 is blocking outbound shipments.
Followups: Order new hydraulic pump for Door 4, quote epoxy re-coating for bay 2 floor, get safety signs posted.`,
  },
  {
    id: "preset-hazard",
    title: "Urgent Hazard Log",
    icon: Zap,
    badge: "Emergency",
    text: `*** CRITICAL HAZARD FIELD REPORT ***
LOCATION: ChemCorp Storage Facility, 77 Refinery Rd, Sector 9, Houston, TX
CLIENT: ChemCorp Industrial Products
DATE: 2026-08-21
URGENCY: CRITICAL

NOTES:
Main exhaust scrubber pump failed completely (STATUS: REPLACE). Toxic vapor buildup detected in section 3.
Safety Isolation Valve #12 is stuck in open position (STATUS: NEEDS_REPAIR).
Backup Battery UPS System is ONLINE and OPERATIONAL.

BUDGET: Unknown / TBD by engineering assessment.

OBSERVATIONS:
- Hazmat sensor warning beacon flashing yellow in Zone B.
- Secondary containment basin holds 4 inches of rainwater that must be pumped out.
- Safety shower #2 eyewash station water pressure is below OSHA minimum.

ACTIONS REQUIRED:
1. Immediately evacuate non-essential personnel from Section 3.
2. Dispatch emergency valve repair crew within 2 hours.
3. Order replacement scrubber pump on expedited air freight.
4. Perform OSHA eyewash pressure calibration.`,
  },
];

const COLOR_TIPS = [
  {
    num: 1,
    title: "Saturated vs Muted",
    desc: "Muted colors add gray for sophistication. We use Muted Sage Green (#789c78) and Dusty Terracotta (#d47a63) instead of glaring neon primary colors.",
  },
  {
    num: 2,
    title: "Deep vs Dark",
    desc: "Deep means dark + saturated richness (like Deep Warm Obsidian #141310 & Deep Emerald). It avoids flat, lifeless pure black.",
  },
  {
    num: 3,
    title: "Bright vs Vibrant",
    desc: "Vibrant accents focus on intensity rather than high lightness pastel washed-out baby blues.",
  },
  {
    num: 4,
    title: "Warm vs Cool",
    desc: "Warm Gray (#24221d / #3a362f) has brownish undertones instead of cold, sterile blue-gray slate.",
  },
  {
    num: 5,
    title: "Palette Families",
    desc: "Instead of generic adjectives like 'modern', specify families: Earthy Muted (Terracotta, Sage, Warm Gray) or Deep Jewel Tones.",
  },
  {
    num: 6,
    title: "Specific Color Names",
    desc: "Using 'Sage Green' and 'Dusty Terracotta' gives exact designer results rather than AI defaulting to generic blue-purple gradients.",
  },
];

export default function SiteCardDashboard() {
  const [provider, setProvider] = useState<ProviderType>("ollama");
  const [rawText, setRawText] = useState<string>(SAMPLE_PRESETS[0].text);
  const [inspection, setInspection] = useState<SiteInspection>(
    DEFAULT_SITE_INSPECTION
  );
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeModelUsed, setActiveModelUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [palette, setPalette] = useState<PaletteFamily>("earthy");
  const [showColorTips, setShowColorTips] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleParse = async () => {
    if (!rawText.trim()) return;

    setIsParsing(true);
    setErrorMsg(null);
    setActiveModelUsed(null);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          providerOverride: provider,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to parse site notes.");
      }

      setInspection(json.data);
      setActiveModelUsed(`${json.provider.toUpperCase()} (${json.modelName})`);
      showToast("Successfully parsed and structured site notes!");
    } catch (err: any) {
      console.error("Parse Error:", err);
      setErrorMsg(err.message || "An unexpected error occurred during parsing.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(inspection, null, 2));
    setCopied(true);
    showToast("Clean JSON copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const filename = `site-inspection-${(inspection.clientName || "data")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.json`;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(inspection, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Downloaded ${filename}`);
  };

  const handleReset = () => {
    setInspection(DEFAULT_SITE_INSPECTION);
    setErrorMsg(null);
    showToast("Dashboard reset to sample defaults.");
  };

  const updateField = <K extends keyof SiteInspection>(
    key: K,
    value: SiteInspection[K]
  ) => {
    setInspection((prev) => ({ ...prev, [key]: value }));
  };

  const updateEquipment = (index: number, updated: EquipmentNote) => {
    const list = [...inspection.equipmentNotes];
    list[index] = updated;
    setInspection((prev) => ({ ...prev, equipmentNotes: list }));
  };

  const addEquipment = () => {
    const newItem: EquipmentNote = {
      name: "New Equipment Item",
      status: "unknown",
      remarks: "Initial inspection pending",
    };
    setInspection((prev) => ({
      ...prev,
      equipmentNotes: [...prev.equipmentNotes, newItem],
    }));
  };

  const removeEquipment = (index: number) => {
    const list = inspection.equipmentNotes.filter((_, i) => i !== index);
    setInspection((prev) => ({ ...prev, equipmentNotes: list }));
  };

  const updateObservation = (index: number, val: string) => {
    const list = [...inspection.keyObservations];
    list[index] = val;
    setInspection((prev) => ({ ...prev, keyObservations: list }));
  };

  const addObservation = () => {
    setInspection((prev) => ({
      ...prev,
      keyObservations: [...prev.keyObservations, "New observation recorded on site"],
    }));
  };

  const removeObservation = (index: number) => {
    setInspection((prev) => ({
      ...prev,
      keyObservations: prev.keyObservations.filter((_, i) => i !== index),
    }));
  };

  const updateNextStep = (index: number, val: string) => {
    const list = [...inspection.nextSteps];
    list[index] = val;
    setInspection((prev) => ({ ...prev, nextSteps: list }));
  };

  const addNextStep = () => {
    setInspection((prev) => ({
      ...prev,
      nextSteps: [...prev.nextSteps, "Follow up with site manager regarding action item"],
    }));
  };

  const removeNextStep = (index: number) => {
    setInspection((prev) => ({
      ...prev,
      nextSteps: prev.nextSteps.filter((_, i) => i !== index),
    }));
  };

  const getUrgencyBadgeStyles = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case "low":
        return "bg-sage-500/15 text-sage-300 border-sage-500/40";
      case "medium":
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
      case "high":
        return "bg-terracotta-500/20 text-terracotta-300 border-terracotta-500/40";
      case "critical":
        return "bg-rose-900/30 text-rose-300 border-rose-600/50 animate-pulse";
      default:
        return "bg-warmgray-800 text-warmgray-300 border-warmgray-700";
    }
  };

  const getEquipmentStatusPill = (status: EquipmentStatus) => {
    switch (status) {
      case "operational":
        return "bg-sage-500/20 text-sage-300 border-sage-500/40";
      case "needs_repair":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "replace":
        return "bg-terracotta-500/25 text-terracotta-300 border-terracotta-500/50";
      case "unknown":
      default:
        return "bg-warmgray-800 text-warmgray-400 border-warmgray-700";
    }
  };

  const getPaletteContainerClass = () => {
    switch (palette) {
      case "jewel":
        return "theme-jewel-tones";
      case "minimalist":
        return "theme-warm-minimalist";
      case "earthy":
      default:
        return "theme-earthy-muted";
    }
  };

  return (
    <div className={`w-full max-w-7xl mx-auto space-y-6 ${getPaletteContainerClass()}`}>
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-sage-500 text-warmgray-950 font-medium px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 border border-sage-300">
          <CheckCircle2 className="w-5 h-5 text-warmgray-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      
      <div className="bg-warmgray-900/90 backdrop-blur-md border border-warmgray-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sage-500/20 border border-sage-500/30 flex items-center justify-center text-sage-300">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sage-400">
                Anti-Slop Color Theme Engine
              </span>
              <span className="text-[10px] font-mono bg-terracotta-500/20 text-terracotta-300 px-2 py-0.5 rounded border border-terracotta-500/30">
                Earthy & Muted
              </span>
            </div>
            <p className="text-xs text-warmgray-400">
              Palette Family: <strong className="text-warmgray-200">Sage Green & Dusty Terracotta on Warm Charcoal</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          
          <div className="flex items-center gap-1 bg-warmgray-950 p-1 rounded-xl border border-warmgray-800 text-xs">
            <span className="text-[11px] font-medium text-warmgray-400 px-2.5 hidden sm:inline">
              Family:
            </span>
            <button
              type="button"
              onClick={() => setPalette("earthy")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                palette === "earthy"
                  ? "bg-sage-600 text-warmgray-50 shadow-md shadow-sage-900/40"
                  : "text-warmgray-400 hover:text-warmgray-200"
              }`}
            >
              <span> Earthy Muted</span>
            </button>

            <button
              type="button"
              onClick={() => setPalette("jewel")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                palette === "jewel"
                  ? "bg-emerald-700 text-emerald-100 shadow-md shadow-emerald-950/40"
                  : "text-warmgray-400 hover:text-warmgray-200"
              }`}
            >
              <span> Jewel Tones</span>
            </button>

            <button
              type="button"
              onClick={() => setPalette("minimalist")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                palette === "minimalist"
                  ? "bg-amber-700/80 text-amber-100 shadow-md"
                  : "text-warmgray-400 hover:text-warmgray-200"
              }`}
            >
              <span> Warm Sand</span>
            </button>
          </div>

          
          <button
            type="button"
            onClick={() => setShowColorTips(!showColorTips)}
            className="px-3 py-2 rounded-xl bg-warmgray-800/80 hover:bg-warmgray-700 text-sage-300 border border-warmgray-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-sage-400" />
            <span>6 Color Rules</span>
          </button>
        </div>
      </div>

      
      {showColorTips && (
        <div className="bg-warmgray-900 border border-sage-500/30 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 transition-all">
          <div className="flex items-center justify-between border-b border-warmgray-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-terracotta-400" />
              <h3 className="text-sm font-bold text-warmgray-100">
                6 Ways Designers Speak About Colors (Anti-AI Slop Guide)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowColorTips(false)}
              className="text-warmgray-400 hover:text-warmgray-100 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {COLOR_TIPS.map((tip) => (
              <div
                key={tip.num}
                className="bg-warmgray-950/80 border border-warmgray-800 rounded-xl p-3.5 space-y-1.5 hover:border-sage-500/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sage-500/20 text-sage-300 font-mono text-xs font-bold flex items-center justify-center border border-sage-500/30">
                    {tip.num}
                  </span>
                  <span className="text-xs font-bold text-warmgray-200">
                    {tip.title}
                  </span>
                </div>
                <p className="text-[11px] text-warmgray-400 leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      
      <div className="bg-warmgray-900/90 backdrop-blur-md border border-warmgray-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sage-400 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sage-400">
              Live AI Data Extraction Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-warmgray-100 mt-1">
            Unstructured Site Notes Parser
          </h1>
          <p className="text-sm text-warmgray-400 mt-0.5">
            Extract raw emails, audio transcripts, and field logs into schema-validated interactive cards.
          </p>
        </div>

        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto bg-warmgray-950 p-1.5 rounded-xl border border-warmgray-800">
          <span className="text-xs font-medium text-warmgray-400 px-3 py-1 self-center hidden sm:inline">
            LLM Provider:
          </span>
          <div className="grid grid-cols-3 gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setProvider("ollama")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                provider === "ollama"
                  ? "bg-sage-600 text-warmgray-50 shadow-md shadow-sage-900/30"
                  : "text-warmgray-400 hover:text-warmgray-200 hover:bg-warmgray-800/50"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-sage-300" />
              <span>Ollama (Local)</span>
            </button>

            <button
              type="button"
              onClick={() => setProvider("openai")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                provider === "openai"
                  ? "bg-terracotta-600 text-warmgray-50 shadow-md shadow-terracotta-900/30"
                  : "text-warmgray-400 hover:text-warmgray-200 hover:bg-warmgray-800/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-terracotta-300" />
              <span>OpenAI</span>
            </button>

            <button
              type="button"
              onClick={() => setProvider("google")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                provider === "google"
                  ? "bg-amber-700/80 text-warmgray-50 shadow-md"
                  : "text-warmgray-400 hover:text-warmgray-200 hover:bg-warmgray-800/50"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Gemini</span>
            </button>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-warmgray-900/90 backdrop-blur-md border border-warmgray-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-warmgray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sage-400" />
                Unstructured Inspection Log
              </label>
              <span className="text-xs text-warmgray-500 font-mono">
                {rawText.length} chars
              </span>
            </div>

            
            <div>
              <span className="text-xs font-medium text-warmgray-400 block mb-2">
                Quick Sample Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setRawText(preset.text)}
                      className="p-2.5 rounded-xl border border-warmgray-800 bg-warmgray-950/60 hover:bg-warmgray-800/80 hover:border-warmgray-700 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className="w-4 h-4 text-sage-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warmgray-800 text-warmgray-400">
                          {preset.badge}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-warmgray-200 truncate">
                        {preset.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            
            <div className="relative">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste messy inspection notes, transcriptions, email threads, or bullet points here..."
                rows={12}
                className="w-full bg-warmgray-950/90 border border-warmgray-800 rounded-xl p-3.5 text-sm text-warmgray-200 placeholder-warmgray-500 focus:outline-none focus:ring-2 focus:ring-sage-500/50 focus:border-sage-500 font-mono transition-all resize-y"
              />
            </div>

            
            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing || !rawText.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sage-700 via-sage-600 to-terracotta-700 hover:from-sage-600 hover:to-terracotta-600 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-warmgray-50 font-semibold text-sm shadow-lg shadow-sage-900/30 flex items-center justify-center gap-2 transition-all"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-warmgray-100" />
                  <span>Extracting & Validating Schema...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sage-200" />
                  <span>Parse & Structure Notes ({provider.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>

          
          {errorMsg && (
            <div className="bg-terracotta-950/50 border border-terracotta-800/60 rounded-xl p-4 space-y-2 text-terracotta-200 text-xs shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-terracotta-300">
                <AlertTriangle className="w-4 h-4 text-terracotta-400 shrink-0" />
                <span>Extraction Error</span>
              </div>
              <p className="leading-relaxed">{errorMsg}</p>
              {provider === "ollama" && (
                <div className="bg-terracotta-900/20 p-2.5 rounded-lg text-[11px] text-terracotta-300 font-mono border border-terracotta-800/30 space-y-1">
                  <div> Ollama Troubleshooting:</div>
                  <div>1. Ensure Ollama is running (`ollama serve`)</div>
                  <div>2. Pull model: `ollama run llama3.2`</div>
                  <div>3. Or switch provider to Cloud (OpenAI / Gemini) in top header</div>
                </div>
              )}
            </div>
          )}

          
          {activeModelUsed && !errorMsg && (
            <div className="bg-sage-950/40 border border-sage-800/50 rounded-xl p-3 flex items-center justify-between text-xs text-sage-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sage-400" />
                <span>Parsed via <strong>{activeModelUsed}</strong></span>
              </div>
              <span className="text-[10px] font-mono bg-sage-900/50 px-2 py-0.5 rounded text-sage-300 border border-sage-700/40">
                Schema Validated
              </span>
            </div>
          )}
        </div>

        
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-warmgray-900/90 backdrop-blur-md border border-warmgray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-sage-600/10 rounded-full blur-3xl pointer-events-none" />

            
            {isParsing && (
              <div className="absolute inset-0 z-20 bg-warmgray-900/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8 transition-opacity">
                <Loader2 className="w-10 h-10 text-sage-400 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-warmgray-100">
                    Extracting Structured Inspection JSON...
                  </p>
                  <p className="text-xs text-warmgray-400 max-w-sm">
                    Analyzing entities, equipment statuses, observations, and next steps via {provider.toUpperCase()}.
                  </p>
                </div>
              </div>
            )}

            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-warmgray-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sage-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-warmgray-400">
                    Site Inspection Summary
                  </span>
                </div>
                <h2 className="text-lg font-bold text-warmgray-100 mt-1">
                  {inspection.clientName || "Unknown Client"}
                </h2>
              </div>

              
              <div className="flex items-center gap-2">
                <span className="text-xs text-warmgray-400 font-medium hidden sm:inline">
                  Urgency:
                </span>
                <select
                  value={inspection.urgencyLevel}
                  onChange={(e) =>
                    updateField("urgencyLevel", e.target.value as UrgencyLevel)
                  }
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all outline-none cursor-pointer ${getUrgencyBadgeStyles(
                    inspection.urgencyLevel
                  )}`}
                >
                  <option value="low" className="bg-warmgray-900 text-sage-300">
                     Low Urgency
                  </option>
                  <option value="medium" className="bg-warmgray-900 text-amber-300">
                     Medium Urgency
                  </option>
                  <option value="high" className="bg-warmgray-900 text-terracotta-300">
                     High Urgency
                  </option>
                  <option value="critical" className="bg-warmgray-900 text-rose-300">
                     CRITICAL URGENCY
                  </option>
                </select>
              </div>
            </div>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-warmgray-800">
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-warmgray-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-warmgray-500" />
                  Client Name
                </label>
                <input
                  type="text"
                  value={inspection.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                  className="w-full bg-warmgray-950/80 border border-warmgray-800 rounded-lg px-3 py-2 text-sm text-warmgray-200 focus:outline-none focus:border-sage-500 transition-colors"
                />
              </div>

              
              <div className="space-y-1">
                <label className="text-xs font-medium text-warmgray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-warmgray-500" />
                  Inspection Date
                </label>
                <input
                  type="text"
                  value={inspection.inspectionDate}
                  onChange={(e) => updateField("inspectionDate", e.target.value)}
                  className="w-full bg-warmgray-950/80 border border-warmgray-800 rounded-lg px-3 py-2 text-sm text-warmgray-200 focus:outline-none focus:border-sage-500 transition-colors"
                />
              </div>

              
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-warmgray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-warmgray-500" />
                  Site Address
                </label>
                <input
                  type="text"
                  value={inspection.siteAddress}
                  onChange={(e) => updateField("siteAddress", e.target.value)}
                  className="w-full bg-warmgray-950/80 border border-warmgray-800 rounded-lg px-3 py-2 text-sm text-warmgray-200 focus:outline-none focus:border-sage-500 transition-colors"
                />
              </div>

              
              <div className="space-y-1">
                <label className="text-xs font-medium text-warmgray-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-warmgray-500" />
                  Budget Estimate
                </label>
                <input
                  type="number"
                  value={inspection.budgetEstimate ?? ""}
                  onChange={(e) =>
                    updateField(
                      "budgetEstimate",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  placeholder="Not estimated"
                  className="w-full bg-warmgray-950/80 border border-warmgray-800 rounded-lg px-3 py-2 text-sm text-warmgray-200 focus:outline-none focus:border-sage-500 transition-colors"
                />
              </div>

              
              <div className="space-y-1">
                <label className="text-xs font-medium text-warmgray-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-warmgray-500" />
                  Currency
                </label>
                <input
                  type="text"
                  value={inspection.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className="w-full bg-warmgray-950/80 border border-warmgray-800 rounded-lg px-3 py-2 text-sm text-warmgray-200 focus:outline-none focus:border-sage-500 transition-colors"
                />
              </div>
            </div>

            
            <div className="py-5 border-b border-warmgray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-terracotta-400" />
                  <h3 className="text-sm font-semibold text-warmgray-200">
                    Equipment Assessment Notes ({inspection.equipmentNotes?.length || 0})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addEquipment}
                  className="text-xs text-sage-300 hover:text-sage-200 font-medium flex items-center gap-1 bg-sage-500/15 px-2.5 py-1 rounded-lg border border-sage-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Equipment
                </button>
              </div>

              {inspection.equipmentNotes?.length === 0 ? (
                <p className="text-xs text-warmgray-500 italic py-2">
                  No equipment notes logged yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {inspection.equipmentNotes.map((eq, idx) => (
                    <div
                      key={idx}
                      className="bg-warmgray-950/70 border border-warmgray-800 rounded-xl p-3 space-y-2 group hover:border-warmgray-700 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        
                        <input
                          type="text"
                          value={eq.name}
                          onChange={(e) =>
                            updateEquipment(idx, { ...eq, name: e.target.value })
                          }
                          className="bg-transparent text-sm font-semibold text-warmgray-200 focus:outline-none focus:ring-1 focus:ring-sage-500 rounded px-1 -mx-1"
                        />

                        
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={eq.status}
                            onChange={(e) =>
                              updateEquipment(idx, {
                                ...eq,
                                status: e.target.value as EquipmentStatus,
                              })
                            }
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-colors ${getEquipmentStatusPill(
                              eq.status
                            )}`}
                          >
                            <option value="operational" className="bg-warmgray-900 text-sage-300">
                              Operational
                            </option>
                            <option value="needs_repair" className="bg-warmgray-900 text-amber-300">
                              Needs Repair
                            </option>
                            <option value="replace" className="bg-warmgray-900 text-terracotta-300">
                              Replace
                            </option>
                            <option value="unknown" className="bg-warmgray-900 text-warmgray-400">
                              Unknown
                            </option>
                          </select>

                          
                          <button
                            type="button"
                            onClick={() => removeEquipment(idx)}
                            className="text-warmgray-500 hover:text-terracotta-400 p-1 rounded transition-colors"
                            title="Remove equipment note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      
                      <input
                        type="text"
                        value={eq.remarks}
                        onChange={(e) =>
                          updateEquipment(idx, { ...eq, remarks: e.target.value })
                        }
                        placeholder="Add remarks or diagnostic notes..."
                        className="w-full bg-warmgray-900/60 border border-warmgray-800 rounded-lg px-2.5 py-1.5 text-xs text-warmgray-300 focus:outline-none focus:border-sage-500 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            
            <div className="py-5 border-b border-warmgray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-sage-400" />
                  <h3 className="text-sm font-semibold text-warmgray-200">
                    Key Observations ({inspection.keyObservations?.length || 0})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addObservation}
                  className="text-xs text-sage-300 hover:text-sage-200 font-medium flex items-center gap-1 bg-sage-500/15 px-2.5 py-1 rounded-lg border border-sage-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Observation
                </button>
              </div>

              <div className="space-y-2">
                {inspection.keyObservations?.map((obs, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-warmgray-950/60 border border-warmgray-800 rounded-lg px-3 py-2 group hover:border-warmgray-700 transition-all"
                  >
                    <span className="text-xs font-mono text-warmgray-500 shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={obs}
                      onChange={(e) => updateObservation(idx, e.target.value)}
                      className="w-full bg-transparent text-xs text-warmgray-200 focus:outline-none focus:ring-1 focus:ring-sage-500 rounded px-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeObservation(idx)}
                      className="text-warmgray-500 hover:text-terracotta-400 p-1 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            
            <div className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sage-400" />
                  <h3 className="text-sm font-semibold text-warmgray-200">
                    Recommended Next Steps ({inspection.nextSteps?.length || 0})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addNextStep}
                  className="text-xs text-sage-300 hover:text-sage-200 font-medium flex items-center gap-1 bg-sage-500/15 px-2.5 py-1 rounded-lg border border-sage-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>

              <div className="space-y-2">
                {inspection.nextSteps?.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-warmgray-950/60 border border-warmgray-800 rounded-lg px-3 py-2 group hover:border-warmgray-700 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage-400 shrink-0" />
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => updateNextStep(idx, e.target.value)}
                      className="w-full bg-transparent text-xs text-warmgray-200 focus:outline-none focus:ring-1 focus:ring-sage-500 rounded px-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeNextStep(idx)}
                      className="text-warmgray-500 hover:text-terracotta-400 p-1 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            
            <div className="mt-8 pt-5 border-t border-warmgray-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-warmgray-400 hover:text-warmgray-200 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg bg-warmgray-950 border border-warmgray-800 hover:bg-warmgray-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="text-xs font-semibold text-warmgray-200 hover:text-white flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-warmgray-800 hover:bg-warmgray-700 border border-warmgray-700 shadow transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-sage-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-warmgray-400" />
                  )}
                  <span>{copied ? "Copied!" : "Copy Clean JSON"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="text-xs font-semibold text-warmgray-50 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sage-600 hover:bg-sage-500 shadow-md shadow-sage-900/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-sage-200" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
