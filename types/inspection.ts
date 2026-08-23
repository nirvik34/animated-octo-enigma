import { z } from "zod";

export const EquipmentStatusSchema = z.enum([
  "operational",
  "needs_repair",
  "replace",
  "unknown",
]);

export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;

export const EquipmentNoteSchema = z.object({
  name: z.string().catch("Unspecified Equipment").default("Unspecified Equipment"),
  status: EquipmentStatusSchema.catch("unknown").default("unknown"),
  remarks: z.string().catch("No remarks").default("No remarks"),
});

export type EquipmentNote = z.infer<typeof EquipmentNoteSchema>;

export const UrgencyLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>;

export const SiteInspectionSchema = z.object({
  clientName: z
    .string()
    .catch("Unknown Client")
    .default("Unknown Client"),
  siteAddress: z
    .string()
    .catch("Address Not Provided")
    .default("Address Not Provided"),
  inspectionDate: z
    .string()
    .catch(() => new Date().toISOString().split("T")[0])
    .default(() => new Date().toISOString().split("T")[0]),
  budgetEstimate: z.number().nullable().catch(null).default(null),
  currency: z.string().catch("USD").default("USD"),
  urgencyLevel: UrgencyLevelSchema.catch("medium").default("medium"),
  equipmentNotes: z.array(EquipmentNoteSchema).catch([]).default([]),
  keyObservations: z.array(z.string()).catch([]).default([]),
  nextSteps: z.array(z.string()).catch([]).default([]),
});

export type SiteInspection = z.infer<typeof SiteInspectionSchema>;

export const EMPTY_SITE_INSPECTION: SiteInspection = {
  clientName: "",
  siteAddress: "",
  inspectionDate: new Date().toISOString().split("T")[0],
  budgetEstimate: null,
  currency: "USD",
  urgencyLevel: "medium",
  equipmentNotes: [],
  keyObservations: [],
  nextSteps: [],
};

export const DEFAULT_SITE_INSPECTION: SiteInspection = {
  clientName: "Apex Manufacturing Solutions",
  siteAddress: "1040 Industrial Parkway, Building B, Austin, TX 78758",
  inspectionDate: new Date().toISOString().split("T")[0],
  budgetEstimate: 24500,
  currency: "USD",
  urgencyLevel: "high",
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

