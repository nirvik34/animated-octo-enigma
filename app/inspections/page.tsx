"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardView from "@/components/DashboardView";
import { useInspectionContext } from "@/lib/InspectionContext";

export default function InspectionsPage() {
  const router = useRouter();
  const {
    records,
    openModal,
    showToast,
    openMobileSidebar,
    deleteRecord,
  } = useInspectionContext();

  return (
    <DashboardView
      records={records}
      onOpenModal={openModal}
      showToast={showToast}
      onNewInspection={() => router.push("/")}
      onOpenMobileSidebar={openMobileSidebar}
      onDeleteRecord={deleteRecord}
    />
  );
}
