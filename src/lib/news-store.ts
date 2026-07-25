import { type NewsItem } from "@/data/mock";

// Helper to make API requests
async function apiRequest(method: string, body?: any, queryParams?: string) {
  const url = `/api/news${queryParams || ""}`;
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

export async function getNews(): Promise<NewsItem[]> {
  try {
    return await apiRequest("GET");
  } catch (error) {
    console.error("Failed to get news, using fallback:", error);
    // Return mock news as fallback
    return [
      {
        id: "n1",
        title: "Clash Cup 2026: Daftar Sekarang!",
        slug: "clash-cup-2026",
        content: "Turnamen tahunan Clash Cup 2026 akan segera digelar. Dengan total hadiah jutaan rupiah, turnamen ini terbuka untuk semua anggota komunitas.",
        excerpt: "Turnamen tahunan terbesar Clash.Soccer akan segera digelar.",
        coverImage: "",
        date: "2026-07-20",
      },
      {
        id: "n2",
        title: "Jadwal Pertandingan Bulan Juli",
        slug: "jadwal-juli-2026",
        content: "Berikut adalah jadwal lengkap pertandingan Clash.Soccer untuk bulan Juli 2026. Pastikan kamu melakukan RSVP tepat waktu karena slot terbatas.",
        excerpt: "Cek jadwal lengkap Clash.Soccer bulan Juli 2026.",
        coverImage: "",
        date: "2026-07-15",
      },
    ];
  }
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | undefined> {
  try {
    const news = await apiRequest("GET", undefined, `?slug=${slug}`);
    return news[0];
  } catch (error) {
    console.error(`Failed to get news with slug ${slug}, trying fallback:`, error);
    // Try to find in fallback data
    const fallbackNews = await getNews();
    return fallbackNews.find(n => n.slug === slug);
  }
}

export async function createNews(item: NewsItem): Promise<NewsItem[]> {
  try {
    return await apiRequest("POST", item);
  } catch (error) {
    console.error("Failed to create news:", error);
    return getNews();
  }
}

export async function updateNews(id: string, updates: Partial<NewsItem>): Promise<NewsItem[]> {
  try {
    return await apiRequest("PUT", { id, ...updates });
  } catch (error) {
    console.error(`Failed to update news ${id}:`, error);
    return getNews();
  }
}

export async function deleteNews(id: string): Promise<NewsItem[]> {
  try {
    return await apiRequest("DELETE", undefined, `?id=${id}`);
  } catch (error) {
    console.error(`Failed to delete news ${id}:`, error);
    return getNews();
  }
}