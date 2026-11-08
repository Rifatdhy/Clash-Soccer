import { type Setting, type FaqItem } from "@/types";
import { api } from "./api-client";

// Settings
export function getSettings(): Promise<Setting> {
  return api.get<Setting>("/api/settings");
}

export function updateSettings(updates: Partial<Setting>): Promise<Setting> {
  return api.put<Setting>("/api/settings", updates);
}

// FAQs
export function getFaqs(): Promise<FaqItem[]> {
  return api.get<FaqItem[]>("/api/faqs");
}

export function createFaq(faq: FaqItem): Promise<FaqItem[]> {
  return api.post<FaqItem[]>("/api/faqs", faq);
}

export function updateFaq(
  id: string,
  updates: Partial<FaqItem>
): Promise<FaqItem[]> {
  return api.put<FaqItem[]>("/api/faqs", { id, ...updates });
}

export function deleteFaq(id: string): Promise<FaqItem[]> {
  return api.delete<FaqItem[]>(`/api/faqs?id=${encodeURIComponent(id)}`);
}
