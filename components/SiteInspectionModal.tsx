"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building,
  Calendar,
  DollarSign,
  MapPin,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Edit3,
  Check,
  Copy,
  Download,
  Briefcase,
  Plus,
  Trash2,
  FileText
} from "lucide-react";
import { SiteInspection, EquipmentNote, UrgencyLevel } from "@/types/inspection";

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
  const [inspection, setInspection] = useState<SiteInspection>(initialInspection);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedEquipmentForWorkOrder, setSelectedEquipmentForWorkOrder] = useState<EquipmentNote | null>(null);

  useEffect(() => {
    setInspection(initialInspection);
    setIsEditing(false);
  }, [initialInspection, isOpen]);

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

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(inspection, null, 2));
    if (showToast) showToast("JSON payload copied to clipboard");
  };

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
      if (showToast) showToast("Updated inspection record saved");
    }
    setIsEditing(!isEditing);
  };

  const updateField = (key: keyof SiteInspection, value: any) => {
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 text-[11px] font-bold">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Replace
          </span>
        );
      case "needs_repair":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
            <Wrench className="w-3 h-3 text-amber-700" />
            Needs Repair
          </span>
        );
      case "operational":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Operational
          </span>
        );
      case "unknown":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-medium">
            Unknown
          </span>
        );
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return (
          <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
            Critical Urgency
          </span>
        );
      case "high":
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
            High Urgency
          </span>
        );
      case "medium":
        return (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold uppercase tracking-wider">
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-black text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">Site Inspection Record Card</span>
                {getUrgencyBadge(inspection.urgencyLevel)}
              </div>
              <h2 className="text-xl font-extrabold text-[#0b0b0b] tracking-tight mt-0.5">
                {inspection.clientName || "Inspection Details"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleEdit}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                isEditing
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100"
              }`}
            >
              {isEditing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Record</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Record</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4">
            <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center justify-between">
              <span>Site & Operational Metadata</span>
              {isEditing && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Edit Mode Active</span>}
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={inspection.clientName}
                    onChange={(e) => updateField("clientName", e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Site Address</label>
                  <input
                    type="text"
                    value={inspection.siteAddress}
                    onChange={(e) => updateField("siteAddress", e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Inspection Date</label>
                  <input
                    type="text"
                    value={inspection.inspectionDate}
                    onChange={(e) => updateField("inspectionDate", e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Urgency Level</label>
                  <select
                    value={inspection.urgencyLevel}
                    onChange={(e) => updateField("urgencyLevel", e.target.value as UrgencyLevel)}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Estimated Budget</label>
                  <input
                    type="number"
                    value={inspection.budgetEstimate ?? ""}
                    onChange={(e) => updateField("budgetEstimate", e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Currency</label>
                  <input
                    type="text"
                    value={inspection.currency}
                    onChange={(e) => updateField("currency", e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div className="flex items-start gap-2.5">
                  <Building className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Client</span>
                    <span className="text-xs font-bold text-neutral-900">{inspection.clientName || "Not Specified"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Site Location</span>
                    <span className="text-xs font-medium text-neutral-800 leading-snug">{inspection.siteAddress || "Not Provided"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Inspection Date</span>
                    <span className="text-xs font-semibold text-neutral-800">{inspection.inspectionDate || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <DollarSign className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Repair Budget</span>
                    <span className="text-xs font-bold text-neutral-900">
                      {inspection.budgetEstimate ? `${inspection.currency} ${inspection.budgetEstimate.toLocaleString()}` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span>Equipment & Machinery Status</span>
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px]">
                  {inspection.equipmentNotes.length} items
                </span>
              </h3>
              {isEditing && (
                <button
                  onClick={addEquipment}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-black text-white hover:bg-neutral-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Equipment</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {inspection.equipmentNotes.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-50 text-center text-xs text-neutral-500 italic border border-neutral-200">
                  No specific equipment notes recorded.
                </div>
              ) : (
                inspection.equipmentNotes.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateEquipment(idx, { ...item, name: e.target.value })}
                            className="font-bold text-xs bg-white border border-neutral-300 rounded-md px-2.5 py-1.5 flex-1 outline-none"
                          />
                          <select
                            value={item.status}
                            onChange={(e) => updateEquipment(idx, { ...item, status: e.target.value as any })}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white outline-none"
                          >
                            <option value="operational">Operational</option>
                            <option value="needs_repair">Needs Repair</option>
                            <option value="replace">Replace</option>
                            <option value="unknown">Unknown</option>
                          </select>
                          <button
                            onClick={() => removeEquipment(idx)}
                            className="w-7 h-7 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => updateEquipment(idx, { ...item, remarks: e.target.value })}
                          className="w-full text-xs text-neutral-700 bg-white border border-neutral-300 rounded-md px-2.5 py-1.5 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-neutral-900">{item.name}</span>
                            {getEquipmentStatusBadge(item.status)}
                          </div>
                          <p className="text-xs text-neutral-600 leading-relaxed">{item.remarks}</p>
                        </div>

                        {(item.status === "replace" || item.status === "needs_repair") && (
                          <button
                            onClick={() => {
                              setSelectedEquipmentForWorkOrder(item);
                            }}
                            className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-100 flex items-center gap-1.5 shadow-2xs"
                          >
                            <Wrench className="w-3 h-3 text-amber-600" />
                            <span>Dispatch Work Order</span>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Key Field Findings</h3>
                {isEditing && (
                  <button onClick={addObservation} className="text-xs font-semibold text-black hover:underline">
                    + Add Finding
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {inspection.keyObservations.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-2">No key findings logged.</p>
                ) : (
                  inspection.keyObservations.map((obs, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={obs}
                            onChange={(e) => updateObservation(idx, e.target.value)}
                            className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2 outline-none"
                          />
                          <button onClick={() => removeObservation(idx)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-start gap-2 text-xs text-neutral-700 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                          <span>{obs}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Action Plan & Next Steps</h3>
                {isEditing && (
                  <button onClick={addNextStep} className="text-xs font-semibold text-black hover:underline">
                    + Add Action
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {inspection.nextSteps.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-2">No next steps defined.</p>
                ) : (
                  inspection.nextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => updateNextStep(idx, e.target.value)}
                            className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2 outline-none"
                          />
                          <button onClick={() => removeNextStep(idx)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-start gap-2 text-xs text-neutral-800 font-medium leading-relaxed">
                          <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON File</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onDispatchWorkOrder) onDispatchWorkOrder();
                else if (showToast) showToast("Work Order dispatched for site findings");
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Dispatch Work Order</span>
            </button>

            <button
              onClick={onClose}
              className="text-xs font-semibold px-4 py-2 rounded-full bg-neutral-200 text-neutral-800 hover:bg-neutral-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {selectedEquipmentForWorkOrder && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-sm text-[#0b0b0b]">Dispatch Equipment Work Order</h3>
              <button
                onClick={() => setSelectedEquipmentForWorkOrder(null)}
                className="text-xs text-neutral-400 hover:text-black font-semibold"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-neutral-600">
              Confirm maintenance dispatch for equipment item:
            </p>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
              <div className="font-bold text-neutral-900">{selectedEquipmentForWorkOrder.name}</div>
              <div className="text-neutral-500">Status: {selectedEquipmentForWorkOrder.status}</div>
              <div className="text-neutral-700">{selectedEquipmentForWorkOrder.remarks}</div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEquipmentForWorkOrder(null)}
                className="px-4 py-2 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDispatchWorkOrder) onDispatchWorkOrder(selectedEquipmentForWorkOrder);
                  else if (showToast) showToast(`Work order dispatched for ${selectedEquipmentForWorkOrder.name}`);
                  setSelectedEquipmentForWorkOrder(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-full bg-black text-white hover:bg-neutral-800"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
