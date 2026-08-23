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

  const getUrgencyText = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return <span className="text-red-700 font-semibold text-xs">Critical</span>;
      case "high":
        return <span className="text-amber-700 font-semibold text-xs">High</span>;
      case "medium":
        return <span className="text-neutral-700 text-xs">Medium</span>;
      case "low":
      default:
        return <span className="text-neutral-500 text-xs">Low</span>;
    }
  };

  const getSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case "voice":
        return (
          <span className="inline-flex items-center gap-1 text-neutral-600 text-xs">
            <Mic className="w-3 h-3 text-neutral-400" /> Voice
          </span>
        );
      case "email":
        return (
          <span className="inline-flex items-center gap-1 text-neutral-600 text-xs">
            <Mail className="w-3 h-3 text-neutral-400" /> Email
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-neutral-600 text-xs">
            <FileText className="w-3 h-3 text-neutral-400" /> Note
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden p-1.5 rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-all shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-neutral-900">
                Site Inspection Records
              </h1>
              <span className="text-xs text-neutral-500 font-mono">
                ({records.length})
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Field inspection database & operational telemetry logs.
            </p>
          </div>
        </div>

        <button
          onClick={onNewInspection}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded bg-neutral-900 text-white hover:bg-neutral-800 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Import Inspection</span>
        </button>
      </div>

      <div className="p-6 space-y-4 max-w-7xl w-full mx-auto">
        {/* Compact Operational Metrics Strip (Replaces generic 3 rounded KPI cards) */}
        <div className="bg-white border border-neutral-200 rounded divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 grid grid-cols-1 sm:grid-cols-3 text-xs">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-neutral-500 font-medium">Total Managed Sites</span>
            <span className="font-bold text-neutral-900 font-mono text-sm">{records.length}</span>
          </div>

          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-neutral-500 font-medium">High / Critical Hazards</span>
            <span className={`font-bold font-mono text-sm ${criticalCount > 0 ? 'text-red-700' : 'text-neutral-900'}`}>
              {criticalCount}
            </span>
          </div>

          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-neutral-500 font-medium">Est. Total Repair Budget</span>
            <span className="font-bold text-neutral-900 font-mono text-sm">
              ₹{totalBudget.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Search & Urgency Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded border border-neutral-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by client, address, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded pl-8 pr-3 py-1.5 text-xs text-neutral-900 outline-none focus:bg-white focus:border-neutral-400"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs">
            <span className="text-neutral-500 mr-2 text-xs">Urgency:</span>
            {["all", "critical", "high", "medium", "low"].map((filter) => (
              <button
                key={filter}
                onClick={() => setUrgencyFilter(filter)}
                className={`px-2.5 py-1 rounded text-xs capitalize font-medium transition-all ${
                  urgencyFilter === filter
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Inspection Records List */}
        <div className="bg-white border border-neutral-200 rounded divide-y divide-neutral-200">
          {records.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Building className="w-8 h-8 text-neutral-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-neutral-900">No Inspection Records</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Your field inspection log is empty. Click below to parse unstructured inspection notes or audio.
                </p>
              </div>
              <button
                onClick={onNewInspection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import Inspection</span>
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs font-medium text-neutral-600">No inspection records match search criteria.</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setUrgencyFilter("all");
                }}
                className="text-xs text-neutral-900 underline font-medium"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const data = rec.data;
              const { status: recordStatus, missingFields } = getInspectionRecordStatus(data);
              return (
                <div
                  key={rec.id}
                  onClick={() => onOpenModal(data, rec.id)}
                  className="p-4 hover:bg-neutral-50/80 transition-colors cursor-pointer space-y-2.5 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-bold text-neutral-900 group-hover:text-black">
                        {data.clientName || "Unspecified Client"}
                      </h3>

                      <div className="flex items-center gap-2">
                        {recordStatus === "dispatched" ? (
                          <span className="text-[11px] text-blue-700 font-medium">Dispatched</span>
                        ) : recordStatus === "ready" ? (
                          <span className="text-[11px] text-emerald-700 font-medium">Ready</span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">
                            Needs Review ({missingFields.length} missing)
                          </span>
                        )}

                        <span className="text-neutral-300">•</span>
                        {getSourceBadge(rec.sourceType)}
                        <span className="text-neutral-300">•</span>
                        {getUrgencyText(data.urgencyLevel)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleCopyJson(rec, e)}
                        className="px-2 py-1 rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-medium flex items-center gap-1"
                        title="Copy JSON"
                      >
                        <Copy className="w-3 h-3 text-neutral-500" />
                        <span className="hidden sm:inline">JSON</span>
                      </button>

                      <button
                        onClick={(e) => handleDownloadJson(rec, e)}
                        className="px-2 py-1 rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-medium flex items-center gap-1"
                        title="Download JSON"
                      >
                        <Download className="w-3 h-3 text-neutral-500" />
                        <span className="hidden sm:inline">Export</span>
                      </button>

                      <button
                        onClick={() => onOpenModal(data, rec.id)}
                        className="px-2.5 py-1 rounded bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 flex items-center gap-1"
                      >
                        <span>Card</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {onDeleteRecord && (
                        deletingId === rec.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRecord(rec.id);
                                setDeletingId(null);
                              }}
                              className="px-2 py-1 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(null);
                              }}
                              className="px-2 py-1 rounded text-xs text-neutral-600 hover:bg-neutral-200"
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
                            className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{data.siteAddress || "Address unspecified"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>Date: {data.inspectionDate || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-medium text-neutral-900">
                      <DollarSign className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>
                        Est. Budget: {data.budgetEstimate ? `₹${data.budgetEstimate.toLocaleString()}` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Equipment summary inline */}
                  {data.equipmentNotes && data.equipmentNotes.length > 0 && (
                    <div className="text-xs text-neutral-500 flex items-center gap-2 pt-1 flex-wrap">
                      <span className="font-medium text-neutral-700">Equipment ({data.equipmentNotes.length}):</span>
                      {data.equipmentNotes.map((item, idx) => (
                        <span key={idx} className="text-neutral-700">
                          {item.name} <span className="text-neutral-400">({item.status})</span>
                          {idx < data.equipmentNotes.length - 1 && <span className="text-neutral-300 ml-1.5">•</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
