import { type Album } from "@/data/mock";

const STORAGE_KEY = "clash-soccer-albums";

const initialAlbums: Album[] = [
  {
    id: "a1",
    title: "Clash Weekly #45",
    matchDate: "2026-06-20",
    coverUrl: "",
    items: [
      { id: "g1", type: "image", url: "" },
      { id: "g2", type: "image", url: "" },
      { id: "g3", type: "image", url: "" },
      { id: "g4", type: "image", url: "" },
      { id: "g5", type: "video", url: "" },
    ],
  },
  {
    id: "a2",
    title: "Clash Cup 2025",
    matchDate: "2025-12-20",
    coverUrl: "",
    items: [
      { id: "g6", type: "image", url: "" },
      { id: "g7", type: "image", url: "" },
      { id: "g8", type: "image", url: "" },
      { id: "g9", type: "image", url: "" },
    ],
  },
];

function load(): Album[] {
  if (typeof window === "undefined") return initialAlbums;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAlbums));
      return initialAlbums;
    }
    return JSON.parse(raw);
  } catch {
    return initialAlbums;
  }
}

function save(data: Album[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAlbums(): Album[] {
  return load();
}

export function getAlbumById(id: string): Album | undefined {
  return load().find((a) => a.id === id);
}

export function createAlbum(album: Album): Album[] {
  const data = load();
  data.unshift(album);
  save(data);
  return data;
}

export function updateAlbum(id: string, updates: Partial<Album>): Album[] {
  const data = load().map((a) => (a.id === id ? { ...a, ...updates } : a));
  save(data);
  return data;
}

export function deleteAlbum(id: string): Album[] {
  const data = load().filter((a) => a.id !== id);
  save(data);
  return data;
}

export function addItem(albumId: string, item: { id: string; type: "image" | "video"; url: string }): Album[] {
  const data = load().map((a) =>
    a.id === albumId ? { ...a, items: [...a.items, item] } : a
  );
  save(data);
  return data;
}

export function deleteItem(albumId: string, itemId: string): Album[] {
  const data = load().map((a) =>
    a.id === albumId ? { ...a, items: a.items.filter((i) => i.id !== itemId) } : a
  );
  save(data);
  return data;
}
