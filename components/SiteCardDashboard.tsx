"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  Wrench,
  Building,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  MoreVertical,
  Briefcase
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedEquipmentForWorkOrder, setSelectedEquipmentForWorkOrder] = useState<EquipmentNote | null>(null);
  const [workOrderCreatedCount, setWorkOrderCreatedCount] = useState<number>(0);

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
      setIsEditing(false);
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
    setIsEditing(false);
    showToast("Reset to default sample data");
  };

  const handleCreateWorkOrder = (item?: EquipmentNote) => {
    setWorkOrderCreatedCount((prev) => prev + 1);
    const itemName = item ? item.name : "Inspection Actions";
    showToast(`Work Order generated for ${itemName}`);
    setSelectedEquipmentForWorkOrder(null);
  };

  const updateInspectionField = (key: keyof SiteInspection, value: any) => {
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

  const getEquipmentStatusBadge = (status: string) => {
    switch (status) {
      case "replace":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#dd0000] text-white text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Replace
          </span>
        );
      case "needs_repair":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">
            <Wrench className="w-3 h-3 text-amber-700" />
            Needs Repair
          </span>
        );
      case "operational":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Operational
          </span>
        );
      case "unknown":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-medium">
            Unknown
          </span>
        );
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return (
          <span className="px-3 py-1 rounded-full bg-[#dd0000] text-white text-xs font-bold uppercase tracking-wider">
            Critical Urgency
          </span>
        );
      case "high":
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold uppercase tracking-wider">
            High Urgency
          </span>
        );
      case "medium":
        return (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-xs font-semibold uppercase tracking-wider">
            Medium Urgency
          </span>
        );
      case "low":
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-medium uppercase tracking-wider">
            Low Urgency
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0b0b0b]">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b0b0b] text-white text-sm font-semibold px-5 py-3 rounded-full saniti-shadow-lift flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {selectedEquipmentForWorkOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 max-w-md w-full space-y-4 saniti-shadow-lift animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-base text-[#0b0b0b]">Generate Work Order</h3>
              <button
                onClick={() => setSelectedEquipmentForWorkOrder(null)}
                className="text-xs text-neutral-400 hover:text-black font-semibold"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Create an urgent maintenance work order for:
            </p>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
              <div className="font-bold text-[#0b0b0b]">{selectedEquipmentForWorkOrder.name}</div>
              <div className="text-neutral-500">Status: {selectedEquipmentForWorkOrder.status}</div>
              <div className="text-neutral-600">{selectedEquipmentForWorkOrder.remarks}</div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEquipmentForWorkOrder(null)}
                className="px-4 py-2 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateWorkOrder(selectedEquipmentForWorkOrder)}
                className="px-4 py-2 text-xs font-bold rounded-full bg-[#0b0b0b] text-white hover:bg-neutral-800"
              >
                Confirm Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-neutral-200 sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight flex items-center gap-1.5 text-[#0b0b0b]">
              Saniti<span className="w-2 h-2 rounded-full bg-[#0b0b0b]"></span>
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
              Enterprise v2.1
            </span>
          </div>

          <div className="flex items-center gap-3">
            {workOrderCreatedCount > 0 && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                {workOrderCreatedCount} Work Order{workOrderCreatedCount > 1 ? "s" : ""} Dispatched
              </span>
            )}
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider font-medium">
              Inspection Review
            </span>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="mono-eyebrow text-neutral-500">
                INSPECTION INTELLIGENCE ENGINE
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0b0b0b] leading-[1.2] mt-2">
                Unstructured Notes to Operational Records
              </h1>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Parse raw field notes into schema-validated, actionable inspection reviews for engineering and maintenance teams.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 w-full mb-1">Select sample report:</span>
              <button
                onClick={() => setRawText(PRESET_NOTE_1)}
                className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 hover:bg-neutral-200 transition-colors"
              >
                Apex Chiller
              </button>
              <button
                onClick={() => setRawText(PRESET_NOTE_2)}
                className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 hover:bg-neutral-200 transition-colors"
              >
                Petrochem Hazard
              </button>
              <button
                onClick={() => setRawText(PRESET_NOTE_3)}
                className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 hover:bg-neutral-200 transition-colors"
              >
                Skyline Audit
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 saniti-shadow-lift space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center bg-neutral-100 border border-neutral-200 p-1 rounded-full">
                  <button
                    onClick={() => setProvider("ollama")}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      provider === "ollama"
                        ? "bg-[#0b0b0b] text-white shadow-sm"
                        : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    Ollama (Local)
                  </button>
                  <button
                    onClick={() => setProvider("openai")}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      provider === "openai"
                        ? "bg-[#0b0b0b] text-white shadow-sm"
                        : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    OpenAI
                  </button>
                  <button
                    onClick={() => setProvider("google")}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      provider === "google"
                        ? "bg-[#0b0b0b] text-white shadow-sm"
                        : "text-neutral-600 hover:text-black"
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
                <label className="block text-xs font-bold text-neutral-700 mb-2">
                  Unstructured Field Log / Notes Input
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  placeholder="Paste unstructured site inspection notes, voice transcriptions, or emergency reports here..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3.5 text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200 transition-colors"
                >
                  Clear
                </button>

                <button
                  onClick={handleParse}
                  disabled={loading || !rawText.trim()}
                  className="flex-1 py-2.5 px-6 rounded-full bg-[#0b0b0b] text-white font-bold text-xs hover:bg-neutral-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Log...</span>
                    </>
                  ) : (
                    <>
                      <span>Extract Inspection Record</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-[#dd0000] text-white text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-white" />
                    <span>Extraction Error</span>
                  </div>
                  <p className="opacity-90 leading-relaxed">{errorMsg}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-3">
              <span className="mono-eyebrow text-neutral-500">INSPECTION RECORD</span>
              {getUrgencyBadge(inspection.urgencyLevel)}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0b0b0b] mt-1">
              {inspection.clientName || "Unnamed Inspection"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                isEditing
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200"
              }`}
            >
              {isEditing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Done Editing</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Record</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 hover:bg-neutral-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 hover:bg-neutral-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>

            <button
              onClick={() => handleCreateWorkOrder()}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-[#0b0b0b] text-white hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Dispatch Work Order</span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 saniti-shadow-lift space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-sm text-[#0b0b0b] uppercase tracking-wider">
                  Site & Metadata
                </h3>
                {isEditing && (
                  <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Edit Mode
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={inspection.clientName}
                      onChange={(e) => updateInspectionField("clientName", e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-neutral-900 focus:bg-white focus:ring-1 focus:ring-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Site Address</label>
                    <input
                      type="text"
                      value={inspection.siteAddress}
                      onChange={(e) => updateInspectionField("siteAddress", e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-neutral-900 focus:bg-white focus:ring-1 focus:ring-black outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Date</label>
                      <input
                        type="text"
                        value={inspection.inspectionDate}
                        onChange={(e) => updateInspectionField("inspectionDate", e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-neutral-900 focus:bg-white focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Urgency</label>
                      <select
                        value={inspection.urgencyLevel}
                        onChange={(e) => updateInspectionField("urgencyLevel", e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-neutral-900 focus:bg-white focus:ring-1 focus:ring-black outline-none"
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
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Est. Budget</label>
                      <input
                        type="number"
                        value={inspection.budgetEstimate ?? ""}
                        onChange={(e) => updateInspectionField("budgetEstimate", e.target.value ? Number(e.target.value) : null)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-neutral-900 focus:bg-white focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Currency</label>
                      <input
                        type="text"
                        value={inspection.currency}
                        onChange={(e) => updateInspectionField("currency", e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-neutral-900 focus:bg-white focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-neutral-500 font-medium">Client</div>
                      <div className="text-xs font-bold text-neutral-900">{inspection.clientName || "—"}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-neutral-500 font-medium">Location</div>
                      <div className="text-xs font-medium text-neutral-800 leading-relaxed">{inspection.siteAddress || "—"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <div>
                        <div className="text-[10px] text-neutral-500 font-medium">Inspection Date</div>
                        <div className="text-xs font-semibold text-neutral-800">{inspection.inspectionDate || "—"}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
                      <div>
                        <div className="text-[10px] text-neutral-500 font-medium">Est. Budget</div>
                        <div className="text-xs font-semibold text-neutral-800">
                          {inspection.budgetEstimate ? `${inspection.currency} ${inspection.budgetEstimate.toLocaleString()}` : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-5 saniti-shadow-lift space-y-2">
              <div className="text-xs font-bold text-neutral-700">AI Extraction Metadata</div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Parsed using <span className="font-semibold text-neutral-900">{activeModelUsed}</span>. Schema validation passed.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 saniti-shadow-lift space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-sm text-[#0b0b0b] uppercase tracking-wider">
                    Equipment Status Overview
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800">
                    {inspection.equipmentNotes.length} recorded
                  </span>
                </div>
                {isEditing && (
                  <button
                    onClick={addEquipment}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 hover:bg-neutral-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {inspection.equipmentNotes.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4 text-center">No equipment items recorded.</p>
                ) : (
                  inspection.equipmentNotes.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateEquipment(idx, { ...item, name: e.target.value })}
                              className="font-bold text-xs bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 flex-1 outline-none text-neutral-900 focus:border-black"
                            />
                            <select
                              value={item.status}
                              onChange={(e) => updateEquipment(idx, { ...item, status: e.target.value as any })}
                              className="text-xs font-semibold px-3 py-1.5 rounded-md border border-neutral-200 bg-white outline-none"
                            >
                              <option value="operational">Operational</option>
                              <option value="needs_repair">Needs Repair</option>
                              <option value="replace">Replace</option>
                              <option value="unknown">Unknown</option>
                            </select>
                            <button
                              onClick={() => removeEquipment(idx)}
                              className="w-7 h-7 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) => updateEquipment(idx, { ...item, remarks: e.target.value })}
                            className="w-full text-xs text-neutral-700 bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 outline-none focus:border-black"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-xs text-neutral-900">{item.name}</span>
                              {getEquipmentStatusBadge(item.status)}
                            </div>
                            <p className="text-xs text-neutral-600 leading-relaxed">{item.remarks}</p>
                          </div>

                          {(item.status === "replace" || item.status === "needs_repair") && (
                            <button
                              onClick={() => setSelectedEquipmentForWorkOrder(item)}
                              className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                            >
                              <Wrench className="w-3 h-3 text-neutral-600" />
                              <span>Work Order</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 saniti-shadow-lift space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <h3 className="font-bold text-sm text-[#0b0b0b] uppercase tracking-wider">
                    Key Observations
                  </h3>
                  {isEditing && (
                    <button
                      onClick={addObservation}
                      className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center hover:bg-neutral-200 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {inspection.keyObservations.map((obs, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={obs}
                            onChange={(e) => updateObservation(idx, e.target.value)}
                            className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-neutral-900 outline-none focus:bg-white focus:border-black"
                          />
                          <button
                            onClick={() => removeObservation(idx)}
                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-neutral-400 hover:text-red-600 shrink-0 border border-neutral-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-start gap-2 text-xs text-neutral-700 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0"></span>
                          <span>{obs}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6 saniti-shadow-lift space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <h3 className="font-bold text-sm text-[#0b0b0b] uppercase tracking-wider">
                    Action Plan & Next Steps
                  </h3>
                  {isEditing && (
                    <button
                      onClick={addNextStep}
                      className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center hover:bg-neutral-200 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {inspection.nextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => updateNextStep(idx, e.target.value)}
                            className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-neutral-900 outline-none focus:bg-white focus:border-black"
                          />
                          <button
                            onClick={() => removeNextStep(idx)}
                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-neutral-400 hover:text-red-600 shrink-0 border border-neutral-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-start gap-2 text-xs text-neutral-800 font-medium leading-relaxed">
                          <span className="w-4 h-4 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-neutral-200">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="mono-eyebrow text-neutral-500">FAQ</span>
            <h2 className="text-2xl font-bold text-[#0b0b0b] tracking-tight">Frequently asked questions</h2>
          </div>

          <div className="divide-y divide-neutral-200 pt-4">
            {[
              {
                q: "How does Saniti AI handle unstructured field notes?",
                a: "Saniti passes raw inspection text into language models configured with a strict Zod JSON schema, extracting client names, equipment status, budget estimates, and urgent action items automatically."
              },
              {
                q: "Can I run Saniti completely offline?",
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
                  className="w-full flex items-center justify-between text-left font-bold text-sm py-1 hover:text-black transition-colors text-[#0b0b0b]"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-neutral-800" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-neutral-50 text-neutral-600 py-10 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0b0b0b] text-sm">Saniti AI</span>
            <span>•</span>
            <span>Unstructured Input to Clean Dashboard Parser</span>
          </div>
          <p>© 2026 Saniti Technologies — All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

