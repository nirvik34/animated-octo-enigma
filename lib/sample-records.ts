import { SiteInspection } from "@/types/inspection";

export interface InspectionRecordItem {
  id: string;
  createdAt: string;
  sourceText: string;
  sourceType: "voice" | "email" | "log";
  data: SiteInspection;
}

export const INITIAL_RECORDS: InspectionRecordItem[] = [];

