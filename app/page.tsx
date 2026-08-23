"use client";

import React from "react";
import ChatView from "@/components/ChatView";
import { useInspectionContext } from "@/lib/InspectionContext";

export default function Home() {
  const {
    chatMessages,
    handleSendMessage,
    loading,
    openModal,
    showToast,
    openMobileSidebar,
    records,
  } = useInspectionContext();

  return (
    <ChatView
      messages={chatMessages}
      onSendMessage={handleSendMessage}
      loading={loading}
      onOpenModal={openModal}
      showToast={showToast}
      onOpenMobileSidebar={openMobileSidebar}
      records={records}
    />
  );
}
