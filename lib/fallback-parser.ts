import { SiteInspection, EquipmentNote, UrgencyLevel } from "@/types/inspection";

export function fastFallbackParse(rawText: string): SiteInspection {
  const text = rawText.trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let clientName = "Client name not detected";
  const clientMatch = text.match(/(?:Client|Customer|Company|For):\s*([^\n\r]+)/i);
  if (clientMatch && clientMatch[1]) {
    clientName = clientMatch[1].trim();
  }

  let siteAddress = "Address not detected";
  const addressMatch = text.match(/(?:Site Location|Site|Address|Location):\s*([^\n\r]+)/i);
  if (addressMatch && addressMatch[1]) {
    siteAddress = addressMatch[1].trim();
  } else {
    const streetPattern = text.match(/\b\d{1,5}\s+[A-Za-z0-9\s,\.]+(?:Street|St|Avenue|Ave|Parkway|Pkwy|Highway|Hwy|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Dock\s*\d+)[^\n\r]*/i);
    if (streetPattern) {
      siteAddress = streetPattern[0].trim();
    }
  }

  let inspectionDate = new Date().toISOString().split("T")[0];
  const dateMatch = text.match(/(?:Date|Inspection Date|Audit Date):\s*([^\n\r]+)/i);
  if (dateMatch && dateMatch[1]) {
    const rawDate = dateMatch[1].trim();
    const isoMatch = rawDate.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      inspectionDate = isoMatch[0];
    } else {
      inspectionDate = rawDate;
    }
  } else {
    const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    if (isoMatch) {
      inspectionDate = isoMatch[1];
    }
  }

  let budgetEstimate: number | null = null;
  let currency = "INR";

  if (text.match(/EUR|€/i)) currency = "EUR";
  else if (text.match(/GBP|£/i)) currency = "GBP";
  else if (text.match(/CAD/i)) currency = "CAD";
  else if (text.match(/INR|₹|rupee/i)) currency = "INR";
  else if (text.match(/USD/i)) currency = "USD";

  const budgetMatch = text.match(/(?:Budget|Estimated Budget|Cost|Total Cost):\s*(?:[\$₹]|INR|USD)?\s*([\d,]+(?:\.\d+)?)/i);
  if (budgetMatch && budgetMatch[1]) {
    budgetEstimate = parseFloat(budgetMatch[1].replace(/,/g, ""));
  } else {
    const numericMatch = text.match(/(?:₹|\$|INR|USD)\s*([\d,]+(?:\.\d+)?)/i);
    if (numericMatch && numericMatch[1]) {
      const val = parseFloat(numericMatch[1].replace(/,/g, ""));
      if (val > 100) {
        budgetEstimate = val;
      }
    }
  }

  let urgencyLevel: UrgencyLevel = "medium";
  const upperText = text.toUpperCase();
  if (upperText.includes("CRITICAL") || upperText.includes("SHUTDOWN") || upperText.includes("EVACUATE") || upperText.includes("HAZARD")) {
    urgencyLevel = "critical";
  } else if (upperText.includes("URGENT") || upperText.includes("HIGH") || upperText.includes("IMMEDIATE") || upperText.includes("FAILED")) {
    urgencyLevel = "high";
  } else if (upperText.includes("LOW") || upperText.includes("ROUTINE") || upperText.includes("NORMAL")) {
    urgencyLevel = "low";
  }

  const equipmentNotes: EquipmentNote[] = [];
  const bulletLines = lines.filter((l) => l.startsWith("*") || l.startsWith("-") || l.startsWith("•"));

  for (const line of bulletLines) {
    const cleanLine = line.replace(/^[\*\-•]\s*/, "");
    
    let status: "operational" | "needs_repair" | "replace" | "unknown" = "unknown";
    const lineUpper = cleanLine.toUpperCase();

    if (lineUpper.includes("REPLACE") || lineUpper.includes("CORRODED") || lineUpper.includes("BROKEN") || lineUpper.includes("FAILED")) {
      status = "replace";
    } else if (lineUpper.includes("REPAIR") || lineUpper.includes("VIBRATION") || lineUpper.includes("LEAK") || lineUpper.includes("LOOSE") || lineUpper.includes("WEEPING")) {
      status = "needs_repair";
    } else if (lineUpper.includes("OPERATIONAL") || lineUpper.includes("NORMAL") || lineUpper.includes("CLEAN") || lineUpper.includes("PASSED")) {
      status = "operational";
    }

    let name = cleanLine;
    const colonIdx = cleanLine.indexOf(":");
    if (colonIdx > 0 && colonIdx < 40) {
      name = cleanLine.substring(0, colonIdx).trim();
    } else {
      const verbMatch = cleanLine.match(/^([A-Za-z0-9\s#]+?)(?:\s+(?:showing|operating|failed|unit|belt|valve|pump|switch|loop|sensor|system|gauge))/i);
      if (verbMatch && verbMatch[1] && verbMatch[1].trim().length > 3) {
        name = verbMatch[1].trim();
      }
    }

    equipmentNotes.push({
      name: name || "Equipment Item",
      status,
      remarks: cleanLine,
    });
  }

  const keyObservations: string[] = [];
  const nextSteps: string[] = [];

  let mode: "general" | "observations" | "actions" = "general";

  for (const line of lines) {
    if (line.match(/(?:Key Issues|Observations|Field Findings|Findings):/i)) {
      mode = "observations";
      continue;
    }
    if (line.match(/(?:Next Steps|Action Items|Actions|Recommendations):/i)) {
      mode = "actions";
      continue;
    }

    if (mode === "observations") {
      if (line.startsWith("*") || line.startsWith("-") || line.match(/^\d+\./)) {
        keyObservations.push(line.replace(/^[\*\-\d\.]+\s*/, ""));
      }
    } else if (mode === "actions") {
      if (line.startsWith("*") || line.startsWith("-") || line.match(/^\d+\./)) {
        nextSteps.push(line.replace(/^[\*\-\d\.]+\s*/, ""));
      }
    }
  }

  if (keyObservations.length === 0 && bulletLines.length > 0) {
    keyObservations.push(...bulletLines.slice(0, 3).map((l) => l.replace(/^[\*\-•]\s*/, "")));
  }

  if (nextSteps.length === 0) {
    const actionLines = lines.filter((l) => l.match(/\b(?:schedule|issue|notify|repair|replace|dispatch|inject|file)\b/i));
    nextSteps.push(...actionLines.slice(0, 3));
  }

  return {
    clientName,
    siteAddress,
    inspectionDate,
    budgetEstimate,
    currency,
    urgencyLevel,
    equipmentNotes,
    keyObservations,
    nextSteps,
  };
}

