export interface WhatsAppHolder {
  whatsapp?: string;
  phone?: string;
}

export function normalizeWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

/**
 * WhatsApp numbers may only appear once per match. Compares normalized
 * numbers and returns the raw values from the incoming list that clash.
 */
export function duplicateWhatsAppNumbers(
  existing: WhatsAppHolder[],
  incoming: WhatsAppHolder[]
): string[] {
  const taken = new Set(
    existing
      .map((participant) => participant.whatsapp || participant.phone || "")
      .filter((value) => value.trim() !== "")
      .map(normalizeWhatsApp)
  );

  const duplicates: string[] = [];
  for (const participant of incoming) {
    const raw = participant.whatsapp || participant.phone || "";
    if (raw.trim() === "") continue;

    const normalized = normalizeWhatsApp(raw);
    if (taken.has(normalized)) duplicates.push(raw);
    else taken.add(normalized);
  }

  return duplicates;
}
