import { type Setting, type FaqItem } from "@/types";

// Helper to make API requests
async function apiRequest<T>(
  method: string,
  body?: unknown,
  queryParams?: string
): Promise<T> {
  const url = `/api/settings${queryParams || ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    const errorMessage = result?.error?.message || response.statusText || "An unknown API error occurred";
    throw new Error(errorMessage);
  }

  return result.data as T;
}

// Settings
export async function getSettings(): Promise<Setting> {
  try {
    return await apiRequest("GET");
  } catch (error) {
    console.error("Failed to get settings:", error);
    // Return default settings with actual data
    return {
      communityName: "Clash.Soccer",
      description: "Komunitas mini soccer terbesar di Jakarta. Bermain, berkompetisi, dan nikmati sepak bola bersama kami.",
      logoUrl: "",
      bannerUrl: "",
      whatsapp: "6281234567890",
      instagram: "clash.soccer",
      location: "Jakarta Selatan",
      googleMapsEmbed: "",
    };
  }
}

export async function updateSettings(updates: Partial<Setting>): Promise<Setting> {
  try {
    return await apiRequest("PUT", updates);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return getSettings();
  }
}

// FAQs
async function faqApiRequest<T>(
  method: string,
  body?: unknown,
  queryParams?: string
): Promise<T> {
  const url = `/api/faqs${queryParams || ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    const errorMessage = result?.error?.message || response.statusText || "An unknown API error occurred";
    throw new Error(errorMessage);
  }

  return result.data as T;
}

export async function getFaqs(): Promise<FaqItem[]> {
  try {
    return await faqApiRequest("GET");
  } catch (error) {
    console.error("Failed to get FAQs:", error);
    return [];
  }
}

export async function createFaq(faq: FaqItem): Promise<FaqItem[]> {
  try {
    return await faqApiRequest("POST", faq);
  } catch (error) {
    console.error("Failed to create FAQ:", error);
    return getFaqs();
  }
}

export async function updateFaq(id: string, updates: Partial<FaqItem>): Promise<FaqItem[]> {
  try {
    return await faqApiRequest("PUT", { id, ...updates });
  } catch (error) {
    console.error(`Failed to update FAQ ${id}:`, error);
    return getFaqs();
  }
}

export async function deleteFaq(id: string): Promise<FaqItem[]> {
  try {
    return await faqApiRequest("DELETE", undefined, `?id=${id}`);
  } catch (error) {
    console.error(`Failed to delete FAQ ${id}:`, error);
    return getFaqs();
  }
}
