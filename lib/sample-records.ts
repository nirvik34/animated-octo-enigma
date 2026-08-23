import { SiteInspection } from "@/types/inspection";

export interface InspectionRecordItem {
  id: string;
  createdAt: string;
  sourceText: string;
  sourceType: "voice" | "email" | "log";
  data: SiteInspection;
}

export const INITIAL_RECORDS: InspectionRecordItem[] = [
  {
    id: "rec-001",
    createdAt: "2026-08-21T10:30:00Z",
    sourceType: "log",
    sourceText: `URGENT SITE INSPECTION REPORT
Client: Apex Manufacturing Solutions
Site Location: 1040 Industrial Parkway, Building B, Austin, TX 78758
Date: 2026-08-21
Inspector: Marcus Vance (Senior Field Tech)

Summary:
Conducted quarterly walkthrough of primary utility corridors and mechanical room. Found multiple equipment issues requiring immediate attention before next production shift.

Key Issues & Observations:
* Chiller Unit #3 showing heavy vibration in primary bearing housing. Coolant pressure is currently 18 PSI (normal threshold 32 PSI). Needs technician review.
* Main Transformer Substation thermal sweep clean. No hotspots recorded on infrared camera. Unit is fully operational.
* Backup Diesel Generator failed automatic transfer switch test during simulated outage. Fuel line showing severe rust and corrosion. Recommend immediate replacement.
* Water pooling observed near South Loading Bay electrical sub-panel due to blocked exterior storm drain.
* Fire suppression pressure gauge reading 15% below operational minimum.
* Vibration isolators on air handler units worn beyond recommended tolerance.

Financial & Scheduling:
Estimated total repair and maintenance budget: $24,500 USD.
Urgency: HIGH. Action required within 48 hours.

Next Steps:
1. Issue urgent work order for Backup Generator transfer switch replacement.
2. Schedule HVAC technician to flush and repair Chiller Unit #3 bearing.
3. Notify facility manager regarding South Bay drainage clearing.`,
    data: {
      clientName: "Apex Manufacturing Solutions",
      siteAddress: "1040 Industrial Parkway, Building B, Austin, TX 78758",
      inspectionDate: "2026-08-21",
      budgetEstimate: 24500,
      currency: "USD",
      urgencyLevel: "high",
      equipmentNotes: [
        {
          name: "Chiller Unit #3",
          status: "needs_repair",
          remarks: "Vibration in primary bearing housing. Coolant pressure 18 PSI.",
        },
        {
          name: "Main Transformer Substation",
          status: "operational",
          remarks: "Thermal sweep clean. No hotspots detected.",
        },
        {
          name: "Backup Diesel Generator",
          status: "replace",
          remarks: "Failed automatic transfer switch test. Fuel line corroded.",
        },
      ],
      keyObservations: [
        "Water pooling observed near South Loading Bay electrical sub-panel",
        "Fire suppression pressure gauge reading 15% below operational minimum",
        "Vibration isolators on air handler units worn beyond recommended tolerance",
      ],
      nextSteps: [
        "Issue urgent work order for Backup Generator transfer switch replacement",
        "Schedule HVAC technician to flush and repair Chiller Unit #3 bearing",
        "Notify facility manager regarding South Bay drainage clearing",
      ],
    },
  },
  {
    id: "rec-002",
    createdAt: "2026-08-20T14:15:00Z",
    sourceType: "voice",
    sourceText: `CRITICAL HAZARD FIELD REPORT
Client: Gulf Coast Petrochemical Tank Farm #4
Site: 8800 Maritime Highway, Dock 12, Freeport, TX 77541
Inspection Date: 2026-08-20
Estimated Budget: $68,000 USD

Field Findings:
Emergency inspection triggered by pressure drop alarm on Main Storage Tank #12 pipeline header.
* Main Storage Tank #12 relief valve weeping volatile organic vapors into secondary containment zone. Valve seal compromised. STATUS: REPLACE IMMEDIATELY.
* Secondary Containment Berm wall #3 has 2-inch structural fracture near east drainage valve. Water tight integrity lost. STATUS: NEEDS REPAIR.
* Emergency Shutdown System (ESD) loop tested successful across all 4 remote stations. STATUS: OPERATIONAL.
* Gas detection sensor grid calibrated successfully with zero drift. STATUS: OPERATIONAL.

Observations:
- Containment wall fracture poses environmental compliance risk if heavy rainfall occurs.
- Replacement 4-inch ANSI relief valve is available in regional warehouse stock.

Urgency: CRITICAL. Shutdown zone established.
Action Items:
- Dispatch pipefitting crew for emergency relief valve swap out today.
- Inject epoxy sealant into berm fracture and reinforce with outer buttress.
- File Tier II environmental incident log with regional safety officer.`,
    data: {
      clientName: "Gulf Coast Petrochemical Tank Farm #4",
      siteAddress: "8800 Maritime Highway, Dock 12, Freeport, TX 77541",
      inspectionDate: "2026-08-20",
      budgetEstimate: 68000,
      currency: "USD",
      urgencyLevel: "critical",
      equipmentNotes: [
        {
          name: "Main Storage Tank #12 Relief Valve",
          status: "replace",
          remarks: "Weeping volatile organic vapors into secondary containment zone.",
        },
        {
          name: "Secondary Containment Berm Wall #3",
          status: "needs_repair",
          remarks: "2-inch structural fracture near east drainage valve.",
        },
        {
          name: "Emergency Shutdown System (ESD)",
          status: "operational",
          remarks: "Loop tested successful across all 4 remote stations.",
        },
        {
          name: "Gas Detection Sensor Grid",
          status: "operational",
          remarks: "Calibrated successfully with zero drift.",
        },
      ],
      keyObservations: [
        "Containment wall fracture poses environmental compliance risk if heavy rainfall occurs",
        "Replacement 4-inch ANSI relief valve available in regional warehouse stock",
      ],
      nextSteps: [
        "Dispatch pipefitting crew for emergency relief valve swap out today",
        "Inject epoxy sealant into berm fracture and reinforce with outer buttress",
        "File Tier II environmental incident log with regional safety officer",
      ],
    },
  },
  {
    id: "rec-003",
    createdAt: "2026-08-19T09:00:00Z",
    sourceType: "email",
    sourceText: `ROUTINE PREMISES AUDIT
Client: Skyline Commercial Tower A
Address: 450 North Michigan Avenue, Chicago, IL 60611
Date: 2026-08-19
Budget: $4,200 USD
Urgency: LOW

Details:
Standard bi-monthly physical facility audit.
* Elevator Bank B (Units 1-4) operating within smooth acceleration parameters. Annual certification valid through Nov 2026. STATUS: OPERATIONAL.
* Roof Top Air Handler #2 belt tension loose, slight squeal on start-up. STATUS: NEEDS REPAIR.
* Fire Extinguishers Level 14-22 fully charged and tag dates updated. STATUS: OPERATIONAL.

Notes:
- Overall facility cleanliness excellent.
- Recommended preventive maintenance check for AHU #2 during upcoming weekend window.`,
    data: {
      clientName: "Skyline Commercial Tower A",
      siteAddress: "450 North Michigan Avenue, Chicago, IL 60611",
      inspectionDate: "2026-08-19",
      budgetEstimate: 4200,
      currency: "USD",
      urgencyLevel: "low",
      equipmentNotes: [
        {
          name: "Elevator Bank B (Units 1-4)",
          status: "operational",
          remarks: "Operating within smooth acceleration parameters. Certification valid.",
        },
        {
          name: "Roof Top Air Handler #2",
          status: "needs_repair",
          remarks: "Belt tension loose, slight squeal on start-up.",
        },
        {
          name: "Fire Extinguishers Level 14-22",
          status: "operational",
          remarks: "Fully charged and tag dates updated.",
        },
      ],
      keyObservations: [
        "Overall facility cleanliness excellent",
        "Recommended preventive maintenance check for AHU #2 during weekend window",
      ],
      nextSteps: [
        "Schedule preventive maintenance check for Roof Top Air Handler #2",
      ],
    },
  },
];
