"use client";

import React, { useState } from "react";
import {
  Search,
  Building2,
  ChevronRight,
  Menu,
  Trash2,
} from "lucide-react";
import { InspectionRecordItem } from "@/lib/sample-records";
import { SiteInspection } from "@/types/inspection";

interface ClientsViewProps {
  records: InspectionRecordItem[];
  onOpenModal: (inspection: SiteInspection, recordId?: string) => void;
  onOpenMobileSidebar?: () => void;
  onDeleteRecord?: (id: string) => void;
}

interface ClientSummary {
  name: string;
  inspectionCount: number;
  sites: string[];
  latestInspectionDate: string;
  totalBudget: number;
  inspections: InspectionRecordItem[];
}

export default function ClientsView({
  records,
  onOpenModal,
  onOpenMobileSidebar,
  onDeleteRecord,
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const clientMap = new Map<string, ClientSummary>();

  records.forEach((rec) => {
    const name = rec.data.clientName?.trim() || "Unspecified Client";
    if (!clientMap.has(name)) {
      clientMap.set(name, {
        name,
        inspectionCount: 0,
        sites: [],
        latestInspectionDate: rec.data.inspectionDate || "",
        totalBudget: 0,
        inspections: [],
      });
    }
    const client = clientMap.get(name)!;
    client.inspectionCount += 1;
    client.inspections.push(rec);
    if (rec.data.siteAddress && !client.sites.includes(rec.data.siteAddress)) {
      client.sites.push(rec.data.siteAddress);
    }
    if (rec.data.budgetEstimate) {
      client.totalBudget += rec.data.budgetEstimate;
    }
  });

  const clientsList = Array.from(clientMap.values()).filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeClient = selectedClientName
    ? clientMap.get(selectedClientName) || null
    : clientsList[0] || null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfcfc] overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-all shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-neutral-900 tracking-tight">Clients</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Client accounts and site inspection logs
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
          {clientsList.length} Active Accounts
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-full md:w-80 border-r border-neutral-200 bg-white flex flex-col shrink-0">
          <div className="p-3 border-b border-neutral-200">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {clientsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                No clients found matching your search.
              </div>
            ) : (
              clientsList.map((client) => {
                const isSelected = activeClient?.name === client.name;
                return (
                  <button
                    key={client.name}
                    onClick={() => setSelectedClientName(client.name)}
                    className={`w-full text-left p-3.5 transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-neutral-100 border-l-2 border-black"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-neutral-900 truncate">
                        {client.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                        <span>{client.inspectionCount} inspections</span>
                        <span>•</span>
                        <span>{client.sites.length} sites</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 flex-col overflow-y-auto p-6 bg-[#fcfcfc]">
          {activeClient ? (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-neutral-900">
                        {activeClient.name}
                      </h2>
                      <p className="text-xs text-neutral-500">
                        Client Directory Entry
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Total Inspections</span>
                    <span className="font-semibold text-neutral-900">
                      {activeClient.inspectionCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Known Locations</span>
                    <span className="font-semibold text-neutral-900">
                      {activeClient.sites.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Total Est. Budget</span>
                    <span className="font-semibold text-neutral-900">
                      ₹{activeClient.totalBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Inspection History ({activeClient.inspections.length})
                </h3>

                <div className="space-y-2">
                  {activeClient.inspections.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => onOpenModal(rec.data, rec.id)}
                      className="bg-white border border-neutral-200 hover:border-neutral-400 p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-900 truncate">
                            {rec.data.siteAddress || "Site Location"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize shrink-0 ${
                              rec.data.urgencyLevel === "critical" ||
                              rec.data.urgencyLevel === "high"
                                ? "bg-red-100 text-red-800"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {rec.data.urgencyLevel || "low"} urgency
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-1">
                          {rec.sourceText}
                        </p>
                        <div className="text-[11px] text-neutral-400">
                          Date: {rec.data.inspectionDate || "N/A"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenModal(rec.data, rec.id);
                          }}
                          className="text-xs font-medium text-neutral-700 hover:text-black border border-neutral-200 px-3 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100"
                        >
                          View Card
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
                                Confirm
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
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
              Select a client to view records
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
