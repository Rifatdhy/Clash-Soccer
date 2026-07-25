import { type Setting, type FaqItem } from "@/data/mock";

// Helper to make API requests
async function apiRequest(method: string, body?: any, queryParams?: string) {
  const url = `/api/settings${queryParams || ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
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
export async function getFaqs(): Promise<FaqItem[]> {
  try {
    const res = await fetch("/api/faqs");
    if (!res.ok) {
      throw new Error(`API request failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to get FAQs:", error);
    return [];
  }
}

export async function createFaq(faq: FaqItem): Promise<FaqItem[]> {
  try {
    const res = await fetch("/api/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(faq),
    });
    if (!res.ok) {
      throw new Error(`API request failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to create FAQ:", error);
    return getFaqs();
  }
}

export async function updateFaq(id: string, field: "question" | "answer", value: string): Promise<FaqItem[]> {
  try {
    const res = await fetch("/api/faqs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    if (!res.ok) {
      throw new Error(`API request failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to update FAQ ${id}:`, error);
    return getFaqs();
  }
}

export async function deleteFaq(id: string): Promise<FaqItem[]> {
  try {
    const res = await fetch(`/api/faqs?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`API request failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to delete FAQ ${id}:`, error);
    return getFaqs();
  }
}