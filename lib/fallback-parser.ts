import { SiteInspection, EquipmentNote, UrgencyLevel } from "@/types/inspection";

export function fastFallbackParse(rawText: string): SiteInspection {
  const text = rawText.trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Client Name Extraction
  let clientName = "Client name not detected";
  const clientMatch = text.match(/(?:Client|Customer|Company|For):\s*([^\n\r]+)/i);
  if (clientMatch && clientMatch[1]) {
    clientName = clientMatch[1].trim();
  } else {
    // Check if paperwork is explicitly missing or unknown
    const isPaperworkMissing = text.toLowerCase().includes("paperwork was missing") || text.toLowerCase().includes("paperwork missing");
    
    // Check for named contact person (e.g. "John said", "Contact: John")
    const contactMatch = text.match(/\b([A-Z][a-z]+)\s+(?:said|mentioned|called|reported|requested|notified)\b/);
    const ignoreNames = ["Had", "The", "Need", "Also", "Things", "Anyway", "Inspection", "This"];

    if (contactMatch && contactMatch[1] && !ignoreNames.includes(contactMatch[1])) {
      clientName = isPaperworkMissing 
        ? `${contactMatch[1]} (Contact - Paperwork Missing)`
        : `${contactMatch[1]} (Contact Person)`;
    } else if (isPaperworkMissing) {
      clientName = "Unknown Client (Paperwork Missing)";
    } else {
      // Check for email address or company suffix
      const emailMatch = text.match(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        const domainName = emailMatch[2].split(".")[0];
        const capitalizedDomain = domainName.charAt(0).toUpperCase() + domainName.slice(1);
        clientName = `${capitalizedDomain} (${emailMatch[0]})`;
      } else {
        const companySuffixMatch = text.match(/\b([A-Z][A-Za-z0-9\s&]+(?:Inc|LLC|Corp|Corporation|Ltd|Manufacturing|Plaza|Services|Group))\b/);
        if (companySuffixMatch) {
          clientName = companySuffixMatch[1].trim();
        }
      }
    }
  }

  // 2. Site Address / Location Extraction
  let siteAddress = "Address not detected";
  const addressMatch = text.match(/(?:Site Location|Site|Address|Location):\s*([^\n\r]+)/i);
  if (addressMatch && addressMatch[1]) {
    siteAddress = addressMatch[1].trim();
  } else {
    const streetPattern = text.match(/\b\d{1,5}\s+[A-Za-z0-9\s,\.]+(?:Street|St|Avenue|Ave|Parkway|Pkwy|Highway|Hwy|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Dock\s*\d+)[^\n\r]*/i);
    if (streetPattern) {
      siteAddress = streetPattern[0].trim();
    } else {
      const urlMatch = text.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) {
        siteAddress = `Digital Web Site (${urlMatch[0]})`;
      }
    }
  }

  // 3. Inspection Date Extraction
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
    } else {
      const slashDate = text.match(/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/);
      if (slashDate) {
        inspectionDate = slashDate[1];
      }
    }
  }

  // 4. Budget Estimate & Currency Extraction
  let budgetEstimate: number | null = null;
  let currency = "INR";

  if (text.match(/EUR|€/i)) currency = "EUR";
  else if (text.match(/GBP|£/i)) currency = "GBP";
  else if (text.match(/CAD/i)) currency = "CAD";
  else if (text.match(/INR|₹|rupee/i)) currency = "INR";
  else if (text.match(/USD|\$/i)) currency = "USD";

  const budgetMatch = text.match(/(?:Budget|Estimated Budget|Cost|Total Cost|Price):\s*(?:[\$₹]|INR|USD)?\s*([\d,]+(?:\.\d+)?)/i);
  if (budgetMatch && budgetMatch[1]) {
    budgetEstimate = parseFloat(budgetMatch[1].replace(/,/g, ""));
  } else {
    const numericMatch = text.match(/(?:₹|\$|INR|USD)\s*([\d,]+(?:\.\d+)?)/i);
    if (numericMatch && numericMatch[1]) {
      budgetEstimate = parseFloat(numericMatch[1].replace(/,/g, ""));
    } else {
      // General decimal price pattern like 42.99
      const priceMatch = text.match(/\b(\d{1,6}\.\d{2})\b/);
      if (priceMatch && priceMatch[1]) {
        budgetEstimate = parseFloat(priceMatch[1]);
      }
    }
  }

  // 5. Urgency Level Extraction
  let urgencyLevel: UrgencyLevel = "medium";
  const upperText = text.toUpperCase();
  if (upperText.includes("CRITICAL") || upperText.includes("SHUTDOWN") || upperText.includes("EVACUATE") || upperText.includes("HAZARD")) {
    urgencyLevel = "critical";
  } else if (upperText.includes("URGENT") || upperText.includes("HIGH") || upperText.includes("IMMEDIATE") || upperText.includes("FAILED") || upperText.includes("DISAPPEARED")) {
    urgencyLevel = "high";
  } else if (upperText.includes("LOW") || upperText.includes("ROUTINE") || upperText.includes("NORMAL") || upperText.includes("FINE")) {
    urgencyLevel = "low";
  }

  // 6. Equipment Notes & Item Detection
  const equipmentNotes: EquipmentNote[] = [];
  const bulletLines = lines.filter((l) => l.startsWith("*") || l.startsWith("-") || l.startsWith("•"));

  for (const line of bulletLines) {
    const cleanLine = line.replace(/^[\*\-•]\s*/, "");
    let status: "operational" | "needs_repair" | "replace" | "unknown" = "unknown";
    const lineUpper = cleanLine.toUpperCase();

    if (lineUpper.includes("REPLACE") || lineUpper.includes("CORRODED") || lineUpper.includes("BROKEN") || lineUpper.includes("FAILED")) {
      status = "replace";
    } else if (lineUpper.includes("REPAIR") || lineUpper.includes("VIBRATION") || lineUpper.includes("LEAK") || lineUpper.includes("LOOSE") || lineUpper.includes("DISAPPEARED") || lineUpper.includes("FIX")) {
      status = "needs_repair";
    } else if (lineUpper.includes("OPERATIONAL") || lineUpper.includes("NORMAL") || lineUpper.includes("CLEAN") || lineUpper.includes("PASSED") || lineUpper.includes("FINE")) {
      status = "operational";
    }

    let name = cleanLine;
    const colonIdx = cleanLine.indexOf(":");
    if (colonIdx > 0 && colonIdx < 40) {
      name = cleanLine.substring(0, colonIdx).trim();
    }

    equipmentNotes.push({
      name: name || "Observed Item",
      status,
      remarks: cleanLine,
    });
  }

  // 7. Key Observations & Next Steps
  const keyObservations: string[] = [];
  const nextSteps: string[] = [];

  // Extract TODO items or action phrases
  const todoMatches = text.match(/TODO[^\.,;\n\r]+/gi);
  if (todoMatches) {
    todoMatches.forEach((td) => nextSteps.push(td.trim()));
  }

  // Search lines for action verbs if nextSteps is empty
  const actionLines = lines.filter((l) =>
    l.match(/\b(?:fix|check|ask|remember|buy|schedule|issue|notify|repair|replace|dispatch|investigate)\b/i)
  );
  actionLines.forEach((al) => {
    if (!nextSteps.includes(al) && nextSteps.length < 5) {
      nextSteps.push(al);
    }
  });

  // Collect key observation lines (e.g. sentences describing problems or state)
  const observationSentences = lines.filter((l) =>
    l.match(/\b(?:disappeared|worked|happened|wondering|typing|issue|problem|test|pasted|notes|discussion)\b/i)
  );
  observationSentences.forEach((os) => {
    if (keyObservations.length < 4) {
      keyObservations.push(os.substring(0, 120));
    }
  });

  if (keyObservations.length === 0 && lines.length > 0) {
    keyObservations.push(lines[0].substring(0, 120));
  }

  return {
    clientName,
    siteAddress,
    inspectionDate,
    budgetEstimate,
    currency,
    urgencyLevel,
    status: "needs_review",
    equipmentNotes,
    keyObservations,
    nextSteps,
  };
}
