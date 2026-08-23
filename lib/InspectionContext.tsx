"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ProviderType } from "@/lib/llm-provider";
import { SiteInspection, EMPTY_SITE_INSPECTION } from "@/types/inspection";
import { ChatMessage, InputType } from "@/types/chat";
import { INITIAL_RECORDS, InspectionRecordItem } from "@/lib/sample-records";
import { CustomApiKeys } from "@/components/SettingsModal";

interface InspectionContextType {
  records: InspectionRecordItem[];
  chatMessages: ChatMessage[];
  provider: ProviderType;
  savedKeys: CustomApiKeys;
  isLoaded: boolean;
  loading: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  deleteRecord: (id: string) => void;
  updateRecord: (updated: SiteInspection, recordId?: string) => void;
  handleSendMessage: (text: string, inputType?: InputType) => Promise<void>;
  setProvider: (p: ProviderType) => void;
  handleSaveKeys: (keys: CustomApiKeys) => void;
  
  // Modal state
  isModalOpen: boolean;
  modalInspection: SiteInspection;
  activeModalRecordId: string | null;
  openModal: (inspection: SiteInspection, recordId?: string) => void;
  closeModal: () => void;
  
  // Settings modal
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  
  // Mobile sidebar
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export function InspectionProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<InspectionRecordItem[]>(INITIAL_RECORDS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [provider, setProvider] = useState<ProviderType>("auto");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInspection, setModalInspection] = useState<SiteInspection>(EMPTY_SITE_INSPECTION);
  const [activeModalRecordId, setActiveModalRecordId] = useState<string | null>(null);

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

  // Restore history & provider state from localStorage on mount
  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem("saniti_inspection_records");
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords));
      }

      const storedMessages = localStorage.getItem("saniti_chat_messages");
      if (storedMessages) {
        setChatMessages(JSON.parse(storedMessages));
      }

      const storedProvider = localStorage.getItem("saniti_provider");
      if (storedProvider) {
        setProvider(storedProvider as ProviderType);
      }
    } catch (e) {
      console.error("Failed to restore history from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save records to localStorage whenever updated
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("saniti_inspection_records", JSON.stringify(records));
    } catch (e) {
      console.error("Failed to persist inspection records to localStorage:", e);
    }
  }, [records, isLoaded]);

  // Save chat messages to localStorage whenever updated
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("saniti_chat_messages", JSON.stringify(chatMessages));
    } catch (e) {
      console.error("Failed to persist chat messages to localStorage:", e);
    }
  }, [chatMessages, isLoaded]);

  // Save provider selection to localStorage whenever updated
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("saniti_provider", provider);
    } catch (e) {
      console.error("Failed to persist provider selection to localStorage:", e);
    }
  }, [provider, isLoaded]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSaveKeys = (keys: CustomApiKeys) => {
    setSavedKeys(keys);
    try {
      localStorage.setItem("saniti_api_keys", JSON.stringify(keys));
      showToast("API Keys saved");
    } catch (e) {
      console.error("Failed to save API keys to localStorage:", e);
    }
  };

  const openModal = (inspection: SiteInspection, recordId?: string) => {
    setModalInspection(inspection);
    let matchedId = recordId;
    if (!matchedId) {
      const found = records.find(
        (r) =>
          (r.data.clientName && r.data.clientName === inspection.clientName) ||
          (r.data.siteAddress && r.data.siteAddress === inspection.siteAddress)
      );
      if (found) matchedId = found.id;
    }
    setActiveModalRecordId(matchedId || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveModalRecordId(null);
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (activeModalRecordId === id) {
      closeModal();
    }
    showToast("Inspection record deleted.");
  };

  const updateRecord = (updated: SiteInspection, recordId?: string) => {
    setModalInspection(updated);
    setRecords((prev) =>
      prev.map((rec) => {
        if (
          (recordId && rec.id === recordId) ||
          rec.data.clientName === updated.clientName ||
          (rec.data.siteAddress && rec.data.siteAddress === updated.siteAddress)
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
    <InspectionContext.Provider
      value={{
        records,
        chatMessages,
        provider,
        savedKeys,
        isLoaded,
        loading,
        toastMessage,
        showToast,
        deleteRecord,
        updateRecord,
        handleSendMessage,
        setProvider,
        handleSaveKeys,
        isModalOpen,
        modalInspection,
        activeModalRecordId,
        openModal,
        closeModal,
        isSettingsOpen,
        openSettings: () => setIsSettingsOpen(true),
        closeSettings: () => setIsSettingsOpen(false),
        isMobileSidebarOpen,
        openMobileSidebar: () => setIsMobileSidebarOpen(true),
        closeMobileSidebar: () => setIsMobileSidebarOpen(false),
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspectionContext() {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error("useInspectionContext must be used within an InspectionProvider");
  }
  return context;
}
