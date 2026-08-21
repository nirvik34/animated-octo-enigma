"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Cpu,
  Database,
  Terminal,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  Wrench,
  DollarSign,
  Calendar,
  MapPin,
  Building,
  Activity,
  ArrowRight,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Server,
  Zap,
  Sliders,
  Maximize2
} from "lucide-react";
import { SiteInspection, DEFAULT_SITE_INSPECTION, EquipmentNote } from "@/types/inspection";
import { ProviderType } from "@/lib/llm-provider";

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

export default function SiteCardDashboard() {
  const [rawText, setRawText] = useState<string>(PRESET_NOTE_1);
  const [inspection, setInspection] = useState<SiteInspection>(DEFAULT_SITE_INSPECTION);
  const [provider, setProvider] = useState<ProviderType>("ollama");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeModelUsed, setActiveModelUsed] = useState<string>("OLLAMA (llama3.2)");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [themeVariant, setThemeVariant] = useState<"uber-light" | "uber-dark" | "uber-slate">("uber-light");
  const [showGuideDrawer, setShowGuideDrawer] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setErrorMsg(null);

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
        throw new Error(json.error || "Failed to extract structured data.");
      }

      setInspection(json.data);
      setActiveModelUsed(`${json.provider.toUpperCase()} (${json.modelName})`);
      showToast("Structured site inspection extracted successfully");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected extraction error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(inspection, null, 2));
    showToast("JSON payload copied to clipboard");
  };

  const handleDownloadJson = () => {
    const filename = `site-inspection-${(inspection.clientName || "data")
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

  const handleReset = () => {
    setInspection(DEFAULT_SITE_INSPECTION);
    setRawText(PRESET_NOTE_1);
    setErrorMsg(null);
    showToast("Reset to default sample data");
  };

  const updateInspectionField = (
    key: keyof SiteInspection,
    value: any
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
      name: "New Equipment Unit",
      status: "operational",
      remarks: "Initial inspection check pending",
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
      keyObservations: [...prev.keyObservations, "New field observation entry"],
    }));
  };

  const removeObservation = (index: number) => {
    const list = inspection.keyObservations.filter((_, i) => i !== index);
    setInspection((prev) => ({ ...prev, keyObservations: list }));
  };

  const updateNextStep = (index: number, val: string) => {
    const list = [...inspection.nextSteps];
    list[index] = val;
    setInspection((prev) => ({ ...prev, nextSteps: list }));
  };

  const addNextStep = () => {
    setInspection((prev) => ({
      ...prev,
      nextSteps: [...prev.nextSteps, "New recommended action item"],
    }));
  };

  const removeNextStep = (index: number) => {
    const list = inspection.nextSteps.filter((_, i) => i !== index);
    setInspection((prev) => ({ ...prev, nextSteps: list }));
  };

  const getUrgencyBadgeStyle = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-black text-white border border-black";
      case "high":
        return "bg-neutral-900 text-white border border-neutral-900";
      case "medium":
        return "bg-[#efefef] text-black border border-neutral-300";
      case "low":
      default:
        return "bg-[#f3f3f3] text-neutral-700 border border-neutral-200";
    }
  };

  const getEquipmentStatusStyle = (status: string) => {
    switch (status) {
      case "replace":
        return "bg-black text-white";
      case "needs_repair":
        return "bg-neutral-800 text-white";
      case "operational":
        return "bg-[#efefef] text-black border border-neutral-300";
      case "unknown":
      default:
        return "bg-[#f3f3f3] text-neutral-600 border border-neutral-200";
    }
  };

  const getThemeClass = () => {
    switch (themeVariant) {
      case "uber-dark":
        return "theme-uber-dark bg-black text-white";
      case "uber-slate":
        return "theme-uber-slate bg-slate-900 text-slate-100";
      case "uber-light":
      default:
        return "theme-uber-light bg-white text-black";
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass()} transition-colors duration-200`}>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white text-sm font-medium px-5 py-3 rounded-full uber-shadow-level-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      <header className="border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight font-sans">SitePulse</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">
                v2.0
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <span className="text-black dark:text-white cursor-pointer border-b-2 border-black dark:border-white pb-1">
                Parse Logs
              </span>
              <span className="text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer transition-colors">
                Live Schemas
              </span>
              <span className="text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer transition-colors">
                LLM Benchmark
              </span>
              <span className="text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer transition-colors">
                Enterprise
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGuideDrawer(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-[#efefef] dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Uber Design Spec</span>
            </button>

            <div className="flex items-center bg-[#efefef] dark:bg-neutral-800 p-1 rounded-full text-xs font-medium">
              <button
                onClick={() => setThemeVariant("uber-light")}
                className={`px-3 py-1 rounded-full transition-all ${
                  themeVariant === "uber-light"
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setThemeVariant("uber-dark")}
                className={`px-3 py-1 rounded-full transition-all ${
                  themeVariant === "uber-dark"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setThemeVariant("uber-slate")}
                className={`px-3 py-1 rounded-full transition-all ${
                  themeVariant === "uber-slate"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Slate
              </button>
            </div>

            <button className="hidden sm:inline-flex text-xs font-medium px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors">
              Sign up
            </button>
          </div>
        </div>
      </header>

      {showGuideDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 text-black dark:text-white h-full overflow-y-auto p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    SYSTEM SPECIFICATION
                  </span>
                  <h2 className="text-2xl font-bold mt-1">Uber Design System</h2>
                </div>
                <button
                  onClick={() => setShowGuideDrawer(false)}
                  className="w-8 h-8 rounded-full bg-[#efefef] dark:bg-neutral-800 flex items-center justify-center text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 space-y-6 text-sm">
                <div className="p-4 rounded-2xl bg-[#efefef] dark:bg-neutral-800 space-y-2">
                  <h3 className="font-bold text-base">Black & White Duet</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Restraint over accent slop. Primary conversion targets use Ink Black (#000000) on light canvas (#ffffff). Zero third accent colors.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#efefef] dark:bg-neutral-800 space-y-2">
                  <h3 className="font-bold text-base">Pill Signature</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Interactive controls round to 999px pill shapes. Form tab toggles use 36px pill-tabs. Cards and surfaces round to 16px rounded-2xl.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#efefef] dark:bg-neutral-800 space-y-2">
                  <h3 className="font-bold text-base">Sentence-Case Typography</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Headlines set in weight 700 with tight 1.22-1.25 line-heights. No all-caps display headlines. Body copy set in weights 400 and 500.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#efefef] dark:bg-neutral-800 space-y-2">
                  <h3 className="font-bold text-base">Polarity-Flip Mid Bands</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Pure black bands appear mid-page to create structural depth and contrast rhythm between light feature sections.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setShowGuideDrawer(false)}
                className="w-full py-3 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Close Spec Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-6 pt-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              INDUSTRIAL LOGISTICS & INSPECTION
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black dark:text-white leading-[1.22]">
              Go anywhere with SitePulse AI
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-xl leading-relaxed">
              Convert unstructured field notes, emergency voice transcripts, and maintenance emails into clean, schema-validated inspection cards instantly.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-neutral-500">Sample presets:</span>
              <button
                onClick={() => setRawText(PRESET_NOTE_1)}
                className="text-xs font-medium px-4 py-2 rounded-full bg-[#efefef] dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Apex Chiller
              </button>
              <button
                onClick={() => setRawText(PRESET_NOTE_2)}
                className="text-xs font-medium px-4 py-2 rounded-full bg-[#efefef] dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Petrochem Hazard
              </button>
              <button
                onClick={() => setRawText(PRESET_NOTE_3)}
                className="text-xs font-medium px-4 py-2 rounded-full bg-[#efefef] dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Skyline Audit
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <div className="text-2xl font-bold">100%</div>
                <div className="text-xs text-neutral-500 mt-0.5">Schema Validation</div>
              </div>
              <div>
                <div className="text-2xl font-bold">&lt; 2s</div>
                <div className="text-xs text-neutral-500 mt-0.5">Local Extraction</div>
              </div>
              <div>
                <div className="text-2xl font-bold">Zero</div>
                <div className="text-xs text-neutral-500 mt-0.5">Color Slop</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 uber-shadow-level-2 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center bg-[#efefef] dark:bg-neutral-800 p-1 rounded-[36px]">
                  <button
                    onClick={() => setProvider("ollama")}
                    className={`px-4 py-1.5 rounded-[36px] text-xs font-semibold transition-all ${
                      provider === "ollama"
                        ? "bg-black text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    Ollama (Local)
                  </button>
                  <button
                    onClick={() => setProvider("openai")}
                    className={`px-4 py-1.5 rounded-[36px] text-xs font-semibold transition-all ${
                      provider === "openai"
                        ? "bg-black text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    OpenAI
                  </button>
                  <button
                    onClick={() => setProvider("google")}
                    className={`px-4 py-1.5 rounded-[36px] text-xs font-semibold transition-all ${
                      provider === "google"
                        ? "bg-black text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    Google
                  </button>
                </div>

                <span className="text-xs font-mono text-neutral-500">
                  {provider === "ollama" ? "llama3.2" : provider === "openai" ? "gpt-4o-mini" : "gemini-1.5-flash"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Unstructured Field Notes / Transcript Input
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={7}
                  placeholder="Paste unstructured site inspection notes, voice transcriptions, or emergency reports here..."
                  className="w-full bg-[#efefef] dark:bg-neutral-800 border-0 rounded-lg p-4 text-xs font-mono text-black dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold px-4 py-2.5 rounded-full bg-[#efefef] dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Clear Input
                </button>

                <button
                  onClick={handleParse}
                  disabled={loading || !rawText.trim()}
                  className="flex-1 py-3 px-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting Structured Data...</span>
                    </>
                  ) : (
                    <>
                      <span>Extract Site Data</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-lg bg-black text-white text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Extraction Error</span>
                  </div>
                  <p className="opacity-90 leading-relaxed">{errorMsg}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black text-white py-16 my-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                WHY CHOOSE SITEPULSE
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                Engineering-grade data extraction for urban and industrial logistics
              </h2>
              <p className="text-neutral-400 text-sm max-w-2xl leading-relaxed">
                SitePulse removes manual inspection re-keying by enforcing strict Zod typing, multi-provider resiliency, and clean output formatting.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
              <button
                onClick={() => setShowGuideDrawer(true)}
                className="px-6 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-100 transition-colors inline-flex items-center gap-2"
              >
                <span>Explore Schema Spec</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              STRUCTURED OUTPUT
            </span>
            <h2 className="text-2xl font-bold tracking-tight mt-1">Extracted Site Card Dashboard</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-[#efefef] dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 uber-shadow-level-1 space-y-4">
              <h3 className="font-bold text-base border-b border-neutral-100 dark:border-neutral-800 pb-3">
                General Site Details
              </h3>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Client Name</label>
                <input
                  type="text"
                  value={inspection.clientName}
                  onChange={(e) => updateInspectionField("clientName", e.target.value)}
                  className="w-full bg-[#efefef] dark:bg-neutral-800 border-0 rounded-lg p-2.5 text-xs font-medium text-black dark:text-white focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Site Address</label>
                <input
                  type="text"
                  value={inspection.siteAddress}
                  onChange={(e) => updateInspectionField("siteAddress", e.target.value)}
                  className="w-full bg-[#efefef] dark:bg-neutral-800 border-0 rounded-lg p-2.5 text-xs font-medium text-black dark:text-white focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Date</label>
                  <input
                    type="text"
                    value={inspection.inspectionDate}
                    onChange={(e) => updateInspectionField("inspectionDate", e.target.value)}
                    className="w-full bg-[#efefef] dark:bg-neutral-800 border-0 rounded-lg p-2.5 text-xs font-medium text-black dark:text-white focus:ring-1 focus:ring-black outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Urgency</label>
                  <select
                    value={inspection.urgencyLevel}
                    onChange={(e) => updateInspectionField("urgencyLevel", e.target.value)}
                    className="w-full bg-[#efefef] dark:bg-neutral-800 border-0 rounded-lg p-2.5 text-xs font-medium text-black dark:text-white focus:ring-1 focus:ring-black outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Estimated Budget</label>
                  <input
                    type="number"
                    value={inspection.budgetEstimate ?? ""}
                    onChange={(e) => updateInspectionField("budgetEstimate", e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-[#efefef] dark:bg-neutral-800 border-0 rounded-lg p-2.5 text-xs font-medium text-black dark:text-white focus:ring-1 focus:ring-black outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Currency</label>
                  <input
                    type="text"
                    value={inspection.currency}
                    onChange={(e) => updateInspectionField("currency", e.target.value)}
                    className="w-full bg-[#efefef] dark:bg-neutral-800 border-0 rounded-lg p-2.5 text-xs font-medium text-black dark:text-white focus:ring-1 focus:ring-black outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 uber-shadow-level-1 space-y-3">
              <h3 className="font-bold text-base">Active Model Engine</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Currently parsed using <span className="font-semibold text-black dark:text-white">{activeModelUsed}</span>.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 uber-shadow-level-1 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-base">Equipment Notes</h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#efefef] dark:bg-neutral-800 text-black dark:text-white">
                    {inspection.equipmentNotes.length} items
                  </span>
                </div>
                <button
                  onClick={addEquipment}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Equipment</span>
                </button>
              </div>

              <div className="space-y-3">
                {inspection.equipmentNotes.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-4 text-center">No equipment items recorded.</p>
                ) : (
                  inspection.equipmentNotes.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#efefef] dark:bg-neutral-800 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateEquipment(idx, { ...item, name: e.target.value })}
                          className="font-bold text-xs bg-white dark:bg-neutral-900 border-0 rounded-md px-2.5 py-1.5 flex-1 outline-none text-black dark:text-white"
                        />
                        <select
                          value={item.status}
                          onChange={(e) => updateEquipment(idx, { ...item, status: e.target.value as any })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 outline-none ${getEquipmentStatusStyle(item.status)}`}
                        >
                          <option value="operational">Operational</option>
                          <option value="needs_repair">Needs Repair</option>
                          <option value="replace">Replace</option>
                          <option value="unknown">Unknown</option>
                        </select>
                        <button
                          onClick={() => removeEquipment(idx)}
                          className="w-7 h-7 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => updateEquipment(idx, { ...item, remarks: e.target.value })}
                        className="w-full text-xs text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 border-0 rounded-md px-2.5 py-1.5 outline-none"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 uber-shadow-level-1 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="font-bold text-base">Key Observations</h3>
                  <button
                    onClick={addObservation}
                    className="w-7 h-7 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:opacity-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {inspection.keyObservations.map((obs, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={obs}
                        onChange={(e) => updateObservation(idx, e.target.value)}
                        className="w-full text-xs bg-[#efefef] dark:bg-neutral-800 border-0 rounded-lg p-2.5 text-black dark:text-white outline-none"
                      />
                      <button
                        onClick={() => removeObservation(idx)}
                        className="w-8 h-8 rounded-full bg-[#efefef] dark:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 uber-shadow-level-1 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="font-bold text-base">Recommended Next Steps</h3>
                  <button
                    onClick={addNextStep}
                    className="w-7 h-7 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:opacity-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {inspection.nextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateNextStep(idx, e.target.value)}
                        className="w-full text-xs bg-[#efefef] dark:bg-neutral-800 border-0 rounded-lg p-2.5 text-black dark:text-white outline-none"
                      />
                      <button
                        onClick={() => removeNextStep(idx)}
                        className="w-8 h-8 rounded-full bg-[#efefef] dark:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">FAQ</span>
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 pt-6">
            {[
              {
                q: "How does SitePulse AI handle unstructured field notes?",
                a: "SitePulse passes raw inspection text into language models configured with a strict Zod JSON schema, extracting client names, equipment status, budget estimates, and urgent action items automatically."
              },
              {
                q: "Can I run SitePulse completely offline?",
                a: "Yes. By selecting the Ollama local provider option, all inspection parsing executes on your local workstation without sending data to external cloud services."
              },
              {
                q: "What happens if a field is missing from the inspection transcript?",
                a: "The underlying Zod schema includes robust default fallbacks and catch blocks to prevent parsing failures, ensuring a valid JSON object is returned every time."
              }
            ].map((faq, idx) => (
              <div key={idx} className="py-4">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-base py-2 hover:text-neutral-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-black text-white pt-16 pb-12 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-12 border-b border-neutral-800">
            <div>
              <span className="text-2xl font-bold tracking-tight">SitePulse</span>
              <p className="text-xs text-neutral-400 mt-1">Urban Logistics & Inspection Data Platform</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="text-xs font-semibold px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors">
                Download Inspector App
              </button>
              <button className="text-xs font-semibold px-5 py-2.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors">
                Download Manager App
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-neutral-400">
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Company</h4>
              <p className="hover:text-white cursor-pointer">About us</p>
              <p className="hover:text-white cursor-pointer">Our offerings</p>
              <p className="hover:text-white cursor-pointer">Newsroom</p>
              <p className="hover:text-white cursor-pointer">Careers</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Products</h4>
              <p className="hover:text-white cursor-pointer">Site Inspection</p>
              <p className="hover:text-white cursor-pointer">Fleet Manager</p>
              <p className="hover:text-white cursor-pointer">Safety Audit</p>
              <p className="hover:text-white cursor-pointer">Enterprise API</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Global Citizenship</h4>
              <p className="hover:text-white cursor-pointer">Safety</p>
              <p className="hover:text-white cursor-pointer">Diversity and Inclusion</p>
              <p className="hover:text-white cursor-pointer">Sustainability</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Travel</h4>
              <p className="hover:text-white cursor-pointer">Airports</p>
              <p className="hover:text-white cursor-pointer">Cities</p>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
            <p>© 2026 SitePulse Technologies Inc. — Built on Uber Design System Specifications</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-white cursor-pointer">Privacy</span>
              <span className="hover:text-white cursor-pointer">Accessibility</span>
              <span className="hover:text-white cursor-pointer">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
