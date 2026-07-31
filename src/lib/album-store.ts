import { type Album, type AlbumItem } from "@/types";
import { api, safeApiCall } from "./api-client";

export function getAlbums(): Promise<Album[]> {
  return safeApiCall(
    () => api.get<Album[]>("/api/albums"),
    [],
    "Failed to fetch albums"
  );
}

export function getAlbumById(id: string): Promise<Album | undefined> {
  return safeApiCall(
    async () => {
      const albums = await api.get<Album[]>(`/api/albums?id=${id}`);
      return albums[0];
    },
    undefined,
    `Failed to fetch album ${id}`
  );
}

export function createAlbum(album: Omit<Album, "id" | "items">): Promise<Album[]> {
  return safeApiCall(
    () => api.post<Album[]>("/api/albums", album),
    [],
    "Failed to create album"
  );
}

export function updateAlbum(id: string, updates: Partial<Omit<Album, "id" | "items">>): Promise<Album[]> {
  return safeApiCall(
    () => api.put<Album[]>(`/api/albums?id=${id}`, updates),
    [],
    `Failed to update album ${id}`
  );
}

export function deleteAlbum(id: string): Promise<Album[]> {
  return safeApiCall(
    () => api.delete<Album[]>(`/api/albums?id=${id}`),
    [],
    `Failed to delete album ${id}`
  );
}

export function addItem(albumId: string, item: Omit<AlbumItem, "id">): Promise<Album> {
  return safeApiCall(
    () => api.post<Album>(`/api/albums/items?albumId=${albumId}`, item),
    {} as Album,
    `Failed to add item to album ${albumId}`
  );
}

export function deleteItem(albumId: string, itemId: string): Promise<Album> {
  return safeApiCall(
    () => api.delete<Album>(`/api/albums/items?albumId=${albumId}&itemId=${itemId}`),
    {} as Album,
    `Failed to delete item ${itemId} from album ${albumId}`
  );
}