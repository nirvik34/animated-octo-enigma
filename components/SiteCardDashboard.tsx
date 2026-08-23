"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import DashboardView from "@/components/DashboardView";
import SiteInspectionModal from "@/components/SiteInspectionModal";
import { ProviderType } from "@/lib/llm-provider";
import { SiteInspection, EMPTY_SITE_INSPECTION } from "@/types/inspection";
import { ChatMessage, InputType } from "@/types/chat";
import { INITIAL_RECORDS, InspectionRecordItem } from "@/lib/sample-records";

export default function SiteCardDashboard() {
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard">("chat");
  const [provider, setProvider] = useState<ProviderType>("ollama");
  const [records, setRecords] = useState<InspectionRecordItem[]>(INITIAL_RECORDS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);


  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInspection, setModalInspection] = useState<SiteInspection>(EMPTY_SITE_INSPECTION);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenModal = (inspection: SiteInspection) => {
    setModalInspection(inspection);
    setIsModalOpen(true);
  };

  const handleSaveModalInspection = (updated: SiteInspection) => {
    setModalInspection(updated);
    // Update matching record in records list if present
    setRecords((prev) =>
      prev.map((rec) => {
        if (
          rec.data.clientName === updated.clientName ||
          rec.data.siteAddress === updated.siteAddress
        ) {
          return { ...rec, data: updated };
        }
        return rec;
      })
    );
    showToast("Updated inspection record saved.");
  };

  const handleSendMessage = async (text: string, inputType: InputType = "text") => {
    if (!text.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      inputType,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: text,
          providerOverride: provider,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to extract structured inspection data.");
      }

      const parsedData: SiteInspection = json.data;

      const assistantMsgId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        sender: "assistant",
        text: "Structured inspection extracted successfully.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        parsedData,
        provider: json.provider,
        modelName: json.modelName,
        fallbackUsed: json.fallbackUsed,
        warning: json.warning,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      // Automatically add new record to Inspection Records Dashboard!
      const newRecordItem: InspectionRecordItem = {
        id: `rec-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        sourceType: inputType === "voice" ? "voice" : "log",
        sourceText: text,
        data: parsedData,
      };

      setRecords((prev) => [newRecordItem, ...prev]);
      showToast(`New record created for ${parsedData.clientName || "Client"}!`);
    } catch (err: any) {
      const errorMsgId = `error-${Date.now()}`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: "assistant",
          text: `Extraction error: ${err.message || "An unexpected error occurred."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0b0b] text-neutral-900 selection:bg-[#f36458] selection:text-black font-sans">
      
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-70 bg-black text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-neutral-800 flex items-center gap-2 animate-in slide-in-from-top-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        recordCount={records.length}
        provider={provider}
        onProviderChange={setProvider}
      />

      {/* Main Workspace View */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#fcfcfc]">
        {activeTab === "chat" ? (
          <ChatView
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            loading={loading}
            provider={provider}
            onOpenModal={handleOpenModal}
            showToast={showToast}
          />
        ) : (
          <DashboardView
            records={records}
            onOpenModal={handleOpenModal}
            showToast={showToast}
            onNewInspection={() => setActiveTab("chat")}
          />
        )}
      </main>

      {/* Card Pop-Up Modal */}
      <SiteInspectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inspection={modalInspection}
        onSave={handleSaveModalInspection}
        showToast={showToast}
      />
    </div>
  );
}
