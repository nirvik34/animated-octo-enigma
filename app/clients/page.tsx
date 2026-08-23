"use client";

import React from "react";
import ClientsView from "@/components/ClientsView";
import { useInspectionContext } from "@/lib/InspectionContext";

export default function ClientsPage() {
  const {
    records,
    openModal,
    openMobileSidebar,
    deleteRecord,
  } = useInspectionContext();

  return (
    <ClientsView
      records={records}
      onOpenModal={openModal}
      onOpenMobileSidebar={openMobileSidebar}
      onDeleteRecord={deleteRecord}
    />
  );
}
