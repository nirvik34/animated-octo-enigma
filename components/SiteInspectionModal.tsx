"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Plus,
  Trash2,
  Send,
} from "lucide-react";
import {
  SiteInspection,
  EquipmentNote,
  getInspectionRecordStatus,
} from "@/types/inspection";

interface SiteInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: SiteInspection;
  onSave?: (updated: SiteInspection) => void;
  onDispatchWorkOrder?: (item?: EquipmentNote) => void;
  showToast?: (msg: string) => void;
}

export default function SiteInspectionModal({
  isOpen,
  onClose,
  inspection: initialInspection,
  onSave,
  onDispatchWorkOrder,
  showToast,
}: SiteInspectionModalProps) {
  const [prevInitial, setPrevInitial] = useState<SiteInspection>(initialInspection);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);
  const [inspection, setInspection] = useState<SiteInspection>(initialInspection);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  if (prevInitial !== initialInspection || prevIsOpen !== isOpen) {
    setPrevInitial(initialInspection);
    setPrevIsOpen(isOpen);
    setInspection(initialInspection);
    setIsEditing(false);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { status, missingFields, missingCount } = getInspectionRecordStatus(inspection);

  const isClientMissing =
    !inspection.clientName ||
    inspection.clientName === "Unknown Client" ||
    inspection.clientName === "Client name not detected";

  const isSiteMissing =
    !inspection.siteAddress ||
    inspection.siteAddress === "Address Not Provided" ||
    inspection.siteAddress === "Address not detected";

  const isBudgetMissing = inspection.budgetEstimate === null || inspection.budgetEstimate === undefined;

  const handleDownloadJson = () => {
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
    if (showToast) showToast(`Downloaded ${filename}`);
  };

  const handleToggleEdit = () => {
    if (isEditing && onSave) {
      onSave(inspection);
      if (showToast) showToast("Record saved successfully");
    }
    setIsEditing(!isEditing);
  };

  const handleDispatch = (item?: EquipmentNote) => {
    const updated = { ...inspection, status: "dispatched" as const };
    setInspection(updated);
    if (onSave) onSave(updated);
    if (onDispatchWorkOrder) onDispatchWorkOrder(item);
    else if (showToast) showToast("Work Order dispatched");
  };

  const updateField = (key: keyof SiteInspection, value: unknown) => {
    setInspection((prev) => ({ ...prev, [key]: value }));
  };

  const updateEquipment = (index: number, updated: EquipmentNote) => {
    const list = [...inspection.equipmentNotes];
    list[index] = updated;
    setInspection((prev) => ({ ...prev, equipmentNotes: list }));
  };

  const addEquipment = () => {
    const newItem: EquipmentNote = {
      name: "New HVAC Unit",
      status: "needs_repair",
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

  const renderStatusBadge = () => {
    if (status === "dispatched") {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
          <Send className="w-3.5 h-3.5 text-blue-600" />
          <span>Dispatched</span>
        </div>
      );
    }
    if (status === "needs_review") {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Needs review</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Ready for review</span>
      </div>
    );
  };

  const renderEquipmentBadge = (equipmentStatus: string) => {
    switch (equipmentStatus) {
      case "replace":
        return (
          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-semibold">
            Replace
          </span>
        );
      case "needs_repair":
        return (
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-semibold">
            Needs repair
          </span>
        );
      case "operational":
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
            Operational
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white border border-neutral-300 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden font-sans">
        {/* Card Top Title Bar */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
          <span className="text-sm font-semibold text-neutral-800">Site inspection</span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:text-black hover:bg-neutral-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-neutral-900">
          {/* Header Block */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              {isClientMissing ? (
                <span className="text-neutral-400 font-normal">Client name not detected</span>
              ) : (
                inspection.clientName
              )}
            </h2>
            <div>{renderStatusBadge()}</div>
          </div>

          <hr className="border-neutral-200" />

          {/* Metadata Grid (Client, Site, Date, Budget) */}
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Client Name</label>
                <input
                  type="text"
                  value={inspection.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                  placeholder="e.g. ABC Industries"
                  className="w-full bg-white border border-neutral-300 rounded-md p-2 text-xs text-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Site Address</label>
                <input
                  type="text"
                  value={inspection.siteAddress}
                  onChange={(e) => updateField("siteAddress", e.target.value)}
                  placeholder="e.g. 42 Main Street, Chennai"
                  className="w-full bg-white border border-neutral-300 rounded-md p-2 text-xs text-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Inspection Date</label>
                <input
                  type="text"
                  value={inspection.inspectionDate}
                  onChange={(e) => updateField("inspectionDate", e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-md p-2 text-xs text-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Repair Budget</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={inspection.budgetEstimate ?? ""}
                    onChange={(e) => updateField("budgetEstimate", e.target.value ? Number(e.target.value) : null)}
                    placeholder="e.g. 400000"
                    className="w-full bg-white border border-neutral-300 rounded-md p-2 text-xs text-neutral-900 outline-none"
                  />
                  <input
                    type="text"
                    value={inspection.currency}
                    onChange={(e) => updateField("currency", e.target.value)}
                    placeholder="INR"
                    className="w-20 bg-white border border-neutral-300 rounded-md p-2 text-xs text-neutral-900 outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-5 gap-x-6">
              <div>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  CLIENT
                </span>
                <span className={`text-sm ${isClientMissing ? "text-neutral-400 italic" : "font-medium text-neutral-900"}`}>
                  {isClientMissing ? "Not detected" : inspection.clientName}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  SITE
                </span>
                <span className={`text-sm ${isSiteMissing ? "text-neutral-400 italic" : "font-medium text-neutral-900"}`}>
                  {isSiteMissing ? "Address not detected" : inspection.siteAddress}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  INSPECTION DATE
                </span>
                <span className="text-sm font-medium text-neutral-900">
                  {inspection.inspectionDate || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  REPAIR BUDGET
                </span>
                <span className={`text-sm ${isBudgetMissing ? "text-neutral-400 italic" : "font-semibold text-neutral-900"}`}>
                  {isBudgetMissing
                    ? "Not detected"
                    : `${inspection.currency || "INR"} ${inspection.budgetEstimate?.toLocaleString()}`}
                </span>
              </div>
            </div>
          )}

          {/* Equipment Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                EQUIPMENT
              </span>
              <button
                onClick={addEquipment}
                className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add equipment</span>
              </button>
            </div>

            {inspection.equipmentNotes.length === 0 ? (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
                <span className="text-xs text-neutral-500 italic">No equipment details detected</span>
                <button
                  onClick={addEquipment}
                  className="text-xs font-medium text-neutral-800 hover:underline"
                >
                  + Add equipment
                </button>
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-200 overflow-hidden bg-neutral-50">
                {inspection.equipmentNotes.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs bg-white">
                    {isEditing ? (
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateEquipment(idx, { ...item, name: e.target.value })}
                            className="font-semibold text-xs border border-neutral-300 rounded px-2 py-1 flex-1 outline-none"
                          />
                          <select
                            value={item.status}
                            onChange={(e) => updateEquipment(idx, { ...item, status: e.target.value as EquipmentNote["status"] })}
                            className="text-xs font-medium px-2 py-1 rounded border border-neutral-300 outline-none"
                          >
                            <option value="operational">Operational</option>
                            <option value="needs_repair">Needs repair</option>
                            <option value="replace">Replace</option>
                          </select>
                          <button
                            onClick={() => removeEquipment(idx)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => updateEquipment(idx, { ...item, remarks: e.target.value })}
                          className="w-full text-xs text-neutral-600 border border-neutral-200 rounded px-2 py-1 outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-neutral-900">{item.name}</div>
                          {item.remarks && (
                            <div className="text-neutral-500 text-[11px] leading-relaxed">{item.remarks}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {renderEquipmentBadge(item.status)}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Findings Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                FINDINGS
              </span>
              {isEditing && (
                <button onClick={addObservation} className="text-xs font-medium text-neutral-700 hover:underline">
                  + Add Finding
                </button>
              )}
            </div>

            {inspection.keyObservations.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No additional findings recorded</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-neutral-800">
                {inspection.keyObservations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={obs}
                          onChange={(e) => updateObservation(idx, e.target.value)}
                          className="w-full text-xs border border-neutral-300 rounded p-1.5 outline-none"
                        />
                        <button onClick={() => removeObservation(idx)} className="text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{obs}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Next Steps Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                NEXT STEPS
              </span>
              {isEditing && (
                <button onClick={addNextStep} className="text-xs font-medium text-neutral-700 hover:underline">
                  + Add Step
                </button>
              )}
            </div>

            {inspection.nextSteps.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No next steps defined</p>
            ) : (
              <div className="space-y-1.5 text-xs text-neutral-800">
                {inspection.nextSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => updateNextStep(idx, e.target.value)}
                          className="w-full text-xs border border-neutral-300 rounded p-1.5 outline-none"
                        />
                        <button onClick={() => removeNextStep(idx)} className="text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-neutral-500">{idx + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 space-y-3 shrink-0">
          {missingCount > 0 && status !== "dispatched" && (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {missingCount} {missingCount === 1 ? "field needs" : "fields need"} review (
                {missingFields.join(", ")})
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleEdit}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isEditing
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                }`}
              >
                {isEditing ? "Save record" : "Edit record"}
              </button>

              <button
                onClick={handleDownloadJson}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-100 transition-colors"
              >
                Download JSON
              </button>
            </div>

            <button
              onClick={() => handleDispatch()}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                status === "dispatched"
                  ? "bg-blue-100 text-blue-800 border border-blue-300 cursor-default"
                  : "bg-black text-white hover:bg-neutral-800"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{status === "dispatched" ? "Dispatched" : "Work order"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
