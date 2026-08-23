"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  ExternalLink,
  Building,
  Calendar,
  DollarSign,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Mic,
  Mail,
  FileText,
  Plus,
  Copy,
  Menu,
  Trash2,
} from "lucide-react";
import { InspectionRecordItem } from "@/lib/sample-records";
import { SiteInspection, getInspectionRecordStatus } from "@/types/inspection";

interface DashboardViewProps {
  records: InspectionRecordItem[];
  onOpenModal: (inspection: SiteInspection, recordId?: string) => void;
  showToast: (msg: string) => void;
  onNewInspection: () => void;
  onOpenMobileSidebar?: () => void;
  onDeleteRecord?: (id: string) => void;
}

export default function DashboardView({
  records,
  onOpenModal,
  showToast,
  onNewInspection,
  onOpenMobileSidebar,
  onDeleteRecord,
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredRecords = records.filter((rec) => {
    const data = rec.data;
    const matchesSearch =
      (data.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (data.siteAddress || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.sourceText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUrgency =
      urgencyFilter === "all" ||
      (data.urgencyLevel || "").toLowerCase() === urgencyFilter.toLowerCase();

    return matchesSearch && matchesUrgency;
  });

  const totalBudget = records.reduce(
    (acc, r) => acc + (r.data.budgetEstimate || 0),
    0
  );

  const criticalCount = records.filter(
    (r) =>
      r.data.urgencyLevel === "critical" || r.data.urgencyLevel === "high"
  ).length;

  const handleDownloadJson = (rec: InspectionRecordItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const filename = `site-inspection-${(rec.data.clientName || "record")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}.json`;
    const blob = new Blob([JSON.stringify(rec.data, null, 2)], {
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

  const handleCopyJson = (rec: InspectionRecordItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(rec.data, null, 2));
    showToast("JSON payload copied to clipboard");
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
            Critical
          </span>
        );
      case "high":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider">
            High Urgency
          </span>
        );
      case "medium":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
            Medium
          </span>
        );
      case "low":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-[10px] font-medium uppercase tracking-wider">
            Low
          </span>
        );
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "voice":
        return (
          <span className="flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <Mic className="w-3 h-3" /> Voice Note
          </span>
        );
      case "email":
        return (
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <Mail className="w-3 h-3" /> Email Memo
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <FileText className="w-3 h-3" /> Tech Log
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfcfc] overflow-y-auto">
      <div className="px-6 py-5 border-b border-neutral-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-all shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-[#0b0b0b] tracking-tight">
                Site Inspection Records Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[11px] font-bold">
                {records.length} Total
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Click any record item to view/edit full pop-up card modal or download clean JSON.
            </p>
          </div>
        </div>

        <button
          onClick={onNewInspection}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New AI Chat Extraction</span>
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
              Total Managed Sites
            </span>
            <div className="text-2xl font-black text-[#0b0b0b]">{records.length}</div>
            <p className="text-[11px] text-neutral-400">Extracted from unstructured notes</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
              High / Critical Hazards
            </span>
            <div className="text-2xl font-black text-red-600 flex items-center gap-2">
              <span>{criticalCount}</span>
              {criticalCount > 0 && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />}
            </div>
            <p className="text-[11px] text-neutral-400">Requires swift field intervention</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
              Total Est. Repair Budget
            </span>
            <div className="text-2xl font-black text-emerald-600">
              ₹{totalBudget.toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-400">Aggregated across all field items</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by client, address, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-neutral-900 outline-none focus:bg-white focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase mr-1">Urgency:</span>
            {["all", "critical", "high", "medium", "low"].map((filter) => (
              <button
                key={filter}
                onClick={() => setUrgencyFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  urgencyFilter === filter
                    ? "bg-black text-white shadow-2xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="p-12 text-center bg-white border border-neutral-200 rounded-2xl space-y-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-500">
                <Building className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900">No Inspection Records Yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Your inspection database is currently empty. Use the AI Chat Assistant to parse unstructured text, voice notes, or emails into structured site cards.
                </p>
              </div>
              <button
                onClick={onNewInspection}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Start First AI Extraction</span>
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center bg-white border border-neutral-200 rounded-2xl space-y-3">
              <Building className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-sm font-semibold text-neutral-700">No inspection records match your search filters.</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setUrgencyFilter("all");
                }}
                className="text-xs font-bold text-black underline"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const data = rec.data;
              return (
                <div
                  key={rec.id}
                  onClick={() => onOpenModal(data, rec.id)}
                  className="p-5 bg-white border border-neutral-200 hover:border-black rounded-2xl transition-all shadow-2xs hover:shadow-md cursor-pointer space-y-4 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const { status: recordStatus, missingFields } = getInspectionRecordStatus(data);
                          if (recordStatus === "dispatched") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                Dispatched
                              </span>
                            );
                          }
                          if (recordStatus === "ready") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                Ready
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Needs review ({missingFields.length} missing)
                            </span>
                          );
                        })()}
                        {getSourceIcon(rec.sourceType)}
                        {getUrgencyBadge(data.urgencyLevel)}
                        <span className="text-[10px] font-mono text-neutral-400">ID: {rec.id}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-black transition-colors">
                        {data.clientName || "Unknown Client"}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleCopyJson(rec, e)}
                        className="p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black text-xs font-semibold flex items-center gap-1"
                        title="Copy JSON Payload"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Copy JSON</span>
                      </button>

                      <button
                        onClick={(e) => handleDownloadJson(rec, e)}
                        className="px-3.5 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download JSON</span>
                      </button>

                      <button
                        onClick={() => onOpenModal(data, rec.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold flex items-center gap-1"
                      >
                        <span>Card</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteRecord && (
                        deletingId === rec.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRecord(rec.id);
                                setDeletingId(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-2xs"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(null);
                              }}
                              className="px-2 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(rec.id);
                            }}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Delete</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-neutral-700">
                      <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="truncate">{data.siteAddress || "Address not specified"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-700">
                      <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span>Date: {data.inspectionDate || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-900 font-bold">
                      <DollarSign className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span>
                        Est. Budget: {data.budgetEstimate ? `${data.currency === 'USD' ? '₹' : data.currency} ${data.budgetEstimate.toLocaleString()}` : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Equipment ({data.equipmentNotes.length}):</span>
                    {data.equipmentNotes.length === 0 ? (
                      <span className="text-xs text-neutral-400 italic">None recorded</span>
                    ) : (
                      data.equipmentNotes.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${
                            item.status === "replace"
                              ? "bg-red-50 text-red-800 border-red-200 font-bold"
                              : item.status === "needs_repair"
                              ? "bg-amber-50 text-amber-900 border-amber-200 font-bold"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200"
                          }`}
                        >
                          <Wrench className="w-2.5 h-2.5" />
                          <span>{item.name}</span>
                          <span className="opacity-60">({item.status})</span>
                        </span>
                      ))
                    )}
                    {data.equipmentNotes.length > 3 && (
                      <span className="text-[10px] text-neutral-400 font-semibold">
                        +{data.equipmentNotes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
