"use client";

import React, { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import SiteInspectionModal from "@/components/SiteInspectionModal";
import SettingsModal from "@/components/SettingsModal";
import { useInspectionContext } from "@/lib/InspectionContext";

export default function AppShell({ children }: { children: ReactNode }) {
  const {
    records,
    provider,
    setProvider,
    toastMessage,
    showToast,
    updateRecord,
    deleteRecord,
    savedKeys,
    handleSaveKeys,
    isModalOpen,
    modalInspection,
    activeModalRecordId,
    closeModal,
    isSettingsOpen,
    closeSettings,
    openSettings,
    isMobileSidebarOpen,
    closeMobileSidebar,
  } = useInspectionContext();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121212] text-neutral-900 font-sans">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-70 bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-neutral-800 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Sidebar
        recordCount={records.length}
        provider={provider}
        onProviderChange={setProvider}
        onOpenSettings={openSettings}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#fcfcfc]">
        {children}
      </main>

      <SiteInspectionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        inspection={modalInspection}
        onSave={(updated) => updateRecord(updated, activeModalRecordId || undefined)}
        onDelete={activeModalRecordId ? () => deleteRecord(activeModalRecordId) : undefined}
        showToast={showToast}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        savedKeys={savedKeys}
        onSaveKeys={handleSaveKeys}
        showToast={showToast}
      />
    </div>
  );
}
