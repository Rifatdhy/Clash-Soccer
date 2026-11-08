import { type NewsItem } from "@/types";
import { api } from "./api-client";

export function getNews(): Promise<NewsItem[]> {
  return api.get<NewsItem[]>("/api/news");
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | undefined> {
  const news = await api.get<NewsItem[]>(
    `/api/news?slug=${encodeURIComponent(slug)}`
  );
  return news[0];
}

export function createNews(item: NewsItem): Promise<NewsItem[]> {
  return api.post<NewsItem[]>("/api/news", item);
}

export function updateNews(
  id: string,
  updates: Partial<NewsItem>
): Promise<NewsItem[]> {
  return api.put<NewsItem[]>("/api/news", { id, ...updates });
}

export function deleteNews(id: string): Promise<NewsItem[]> {
  return api.delete<NewsItem[]>(`/api/news?id=${encodeURIComponent(id)}`);
}
