import { type Album, type AlbumItem } from "@/types";
import { api } from "./api-client";

export function getAlbums(): Promise<Album[]> {
  return api.get<Album[]>("/api/albums");
}

export async function getAlbumById(id: string): Promise<Album | undefined> {
  const albums = await api.get<Album[]>(`/api/albums?id=${encodeURIComponent(id)}`);
  return albums[0];
}

export function createAlbum(
  album: Omit<Album, "items"> & { items?: AlbumItem[] }
): Promise<Album[]> {
  return api.post<Album[]>("/api/albums", album);
}

export function updateAlbum(
  id: string,
  updates: Partial<Omit<Album, "id" | "items">>
): Promise<Album[]> {
  return api.put<Album[]>("/api/albums", { id, ...updates });
}

export function deleteAlbum(id: string): Promise<Album[]> {
  return api.delete<Album[]>(`/api/albums?id=${encodeURIComponent(id)}`);
}

export function addItem(
  albumId: string,
  item: Omit<AlbumItem, "id">
): Promise<Album> {
  return api.post<Album>("/api/albums/items", { albumId, ...item });
}

export function deleteItem(itemId: string): Promise<Album> {
  return api.delete<Album>(`/api/albums/items?id=${encodeURIComponent(itemId)}`);
}
