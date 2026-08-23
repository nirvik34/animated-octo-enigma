import { z } from "zod";

export const EquipmentStatusSchema = z.enum([
  "operational",
  "needs_repair",
  "replace",
  "unknown",
]);

export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;

export const EquipmentNoteSchema = z.object({
  name: z.string().describe("Equipment or machinery name"),
  status: EquipmentStatusSchema,
  remarks: z.string().describe("Concise observation or issue description"),
});

export type EquipmentNote = z.infer<typeof EquipmentNoteSchema>;

export const UrgencyLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>;

export const RecordStatusSchema = z.enum(["needs_review", "ready", "dispatched"]);
export type RecordStatus = z.infer<typeof RecordStatusSchema>;

export const SiteInspectionSchema = z.object({
  clientName: z.string().describe("Client company or organization name"),
  siteAddress: z.string().describe("Full site address or physical location"),
  inspectionDate: z.string().describe("Inspection date in YYYY-MM-DD format"),
  budgetEstimate: z.number().nullable().describe("Numerical budget estimate or repair cost, or null if none"),
  currency: z.string().describe("Currency code such as USD, EUR, GBP, INR"),
  urgencyLevel: UrgencyLevelSchema,
  status: RecordStatusSchema,
  equipmentNotes: z.array(EquipmentNoteSchema),
  keyObservations: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export type SiteInspection = z.infer<typeof SiteInspectionSchema>;

export function getInspectionMissingFields(inspection: SiteInspection): string[] {
  const missing: string[] = [];
  if (!inspection.clientName || inspection.clientName === "Unknown Client" || inspection.clientName === "Client name not detected") {
    missing.push("Client Name");
  }
  if (!inspection.siteAddress || inspection.siteAddress === "Address Not Provided" || inspection.siteAddress === "Address not detected") {
    missing.push("Site Location");
  }
  if (inspection.budgetEstimate === null || inspection.budgetEstimate === undefined) {
    missing.push("Repair Budget");
  }
  if (!inspection.equipmentNotes || inspection.equipmentNotes.length === 0) {
    missing.push("Equipment Details");
  }
  return missing;
}

export function getInspectionRecordStatus(inspection: SiteInspection): {
  status: RecordStatus;
  missingFields: string[];
  missingCount: number;
} {
  if (inspection.status === "dispatched") {
    return { status: "dispatched", missingFields: [], missingCount: 0 };
  }
  const missingFields = getInspectionMissingFields(inspection);
  if (missingFields.length > 0) {
    return { status: "needs_review", missingFields, missingCount: missingFields.length };
  }
  return { status: "ready", missingFields: [], missingCount: 0 };
}

export const EMPTY_SITE_INSPECTION: SiteInspection = {
  clientName: "",
  siteAddress: "",
  inspectionDate: new Date().toISOString().split("T")[0],
  budgetEstimate: null,
  currency: "INR",
  urgencyLevel: "medium",
  status: "needs_review",
  equipmentNotes: [],
  keyObservations: [],
  nextSteps: [],
};

export const DEFAULT_SITE_INSPECTION: SiteInspection = {
  clientName: "Apex Manufacturing Solutions",
  siteAddress: "1040 Industrial Parkway, Building B, Austin, TX 78758",
  inspectionDate: new Date().toISOString().split("T")[0],
  budgetEstimate: 24500,
  currency: "INR",
  urgencyLevel: "high",
  status: "ready",
  equipmentNotes: [
    {
      name: "Chiller Unit #3",
      status: "needs_repair",
      remarks: "Vibration in primary bearing housing. Coolant pressure low.",
    },
    {
      name: "Main Transformer Substation",
      status: "operational",
      remarks: "Thermal sweep clear. No hotspots recorded.",
    },
    {
      name: "Backup Diesel Generator",
      status: "replace",
      remarks: "Failed automatic transfer switch test. Fuel line corroded.",
    },
  ],
  keyObservations: [
    "Severe water pooling near South Loading Bay electrical sub-panel",
    "Fire suppression pressure gauge reading 15% below operational minimum",
    "Vibration isolates on air handler units worn beyond recommended tolerance",
  ],
  nextSteps: [
    "Issue urgent work order for Backup Generator transfer switch replacement",
    "Schedule HVAC technician to flush and repair Chiller Unit #3 bearing",
    "Notify facility manager regarding South Bay drainage clearing",
  ],
};


