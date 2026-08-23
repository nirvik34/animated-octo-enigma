"use client";

import React, { useState } from "react";
import Sidebar, { TabType } from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import DashboardView from "@/components/DashboardView";
import ClientsView from "@/components/ClientsView";
import SiteInspectionModal from "@/components/SiteInspectionModal";
import SettingsModal, { CustomApiKeys } from "@/components/SettingsModal";
import { ProviderType } from "@/lib/llm-provider";
import { SiteInspection, EMPTY_SITE_INSPECTION } from "@/types/inspection";
import { ChatMessage, InputType } from "@/types/chat";
import { INITIAL_RECORDS, InspectionRecordItem } from "@/lib/sample-records";

export default function SiteCardDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [provider, setProvider] = useState<ProviderType>("auto");
  const [records, setRecords] = useState<InspectionRecordItem[]>(INITIAL_RECORDS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInspection, setModalInspection] = useState<SiteInspection>(EMPTY_SITE_INSPECTION);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [savedKeys, setSavedKeys] = useState<CustomApiKeys>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem("saniti_api_keys");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Failed to parse saved API keys from localStorage:", e);
      return {};
    }
  });

  const handleSaveKeys = (keys: CustomApiKeys) => {
    setSavedKeys(keys);
    try {
      localStorage.setItem("saniti_api_keys", JSON.stringify(keys));
    } catch (e) {
      console.error("Failed to save API keys to localStorage:", e);
    }
  };

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
          apiKeys: savedKeys,
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
        executionMs: json.executionMs,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      const newRecordItem: InspectionRecordItem = {
        id: `rec-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        sourceType: inputType === "voice" ? "voice" : "log",
        sourceText: text,
        data: parsedData,
      };

      setRecords((prev) => [newRecordItem, ...prev]);
      showToast(`New record created for ${parsedData.clientName || "Client"}!`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      const errorMsgId = `error-${Date.now()}`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: "assistant",
          text: `Extraction error: ${errorMessage}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      showToast(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121212] text-neutral-900 font-sans">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-70 bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-neutral-800 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        recordCount={records.length}
        provider={provider}
        onProviderChange={setProvider}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewInspection={() => setActiveTab("chat")}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#fcfcfc]">
        {activeTab === "chat" ? (
          <ChatView
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            loading={loading}
            onOpenModal={handleOpenModal}
            showToast={showToast}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            records={records}
          />
        ) : activeTab === "clients" ? (
          <ClientsView
            records={records}
            onOpenModal={handleOpenModal}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        ) : (
          <DashboardView
            records={records}
            onOpenModal={handleOpenModal}
            showToast={showToast}
            onNewInspection={() => setActiveTab("chat")}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        )}
      </main>

      <SiteInspectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inspection={modalInspection}
        onSave={handleSaveModalInspection}
        showToast={showToast}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        savedKeys={savedKeys}
        onSaveKeys={handleSaveKeys}
        showToast={showToast}
      />
    </div>
  );
}
