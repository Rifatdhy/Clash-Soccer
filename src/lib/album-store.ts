import { type Album } from "@/data/mock";

// Helper to make API requests
async function apiRequest(method: string, body?: any, queryParams?: string) {
  const url = `/api/albums${queryParams || ""}`;
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

export async function getAlbums(): Promise<Album[]> {
  try {
    return await apiRequest("GET");
  } catch (error) {
    console.error("Failed to get albums, using fallback:", error);
    // Return mock albums as fallback
    return [
      {
        id: "a1",
        title: "Clash Weekly #45",
        matchDate: "2026-06-20",
        coverUrl: "",
        items: [],
      },
      {
        id: "a2",
        title: "Clash Cup 2025",
        matchDate: "2025-12-20",
        coverUrl: "",
        items: [],
      },
    ];
  }
}

export async function getAlbumById(id: string): Promise<Album | undefined> {
  try {
    const albums = await apiRequest("GET", undefined, `?id=${id}`);
    return albums[0];
  } catch (error) {
    console.error(`Failed to get album ${id}, trying fallback:`, error);
    // Try to find in fallback data
    const fallbackAlbums = await getAlbums();
    return fallbackAlbums.find(a => a.id === id);
  }
}

export async function createAlbum(album: Album): Promise<Album[]> {
  try {
    return await apiRequest("POST", album);
  } catch (error) {
    console.error("Failed to create album:", error);
    return getAlbums();
  }
}

export async function updateAlbum(id: string, updates: Partial<Album>): Promise<Album[]> {
  try {
    return await apiRequest("PUT", { id, ...updates });
  } catch (error) {
    console.error(`Failed to update album ${id}:`, error);
    return getAlbums();
  }
}

export async function deleteAlbum(id: string): Promise<Album[]> {
  try {
    return await apiRequest("DELETE", undefined, `?id=${id}`);
  } catch (error) {
    console.error(`Failed to delete album ${id}:`, error);
    return getAlbums();
  }
}

export async function addItem(albumId: string, item: { id: string; type: "image" | "video"; url: string; thumbnailUrl?: string }): Promise<Album[]> {
  try {
    await apiRequest("POST", { albumId, ...item }, "/items");
    return await getAlbums();
  } catch (error) {
    console.error(`Failed to add item to album ${albumId}:`, error);
    return getAlbums();
  }
}

export async function deleteItem(albumId: string, itemId: string): Promise<Album[]> {
  try {
    await apiRequest("DELETE", undefined, `/items?id=${itemId}`);
    return await getAlbums();
  } catch (error) {
    console.error(`Failed to delete item ${itemId} from album ${albumId}:`, error);
    return getAlbums();
  }
}
