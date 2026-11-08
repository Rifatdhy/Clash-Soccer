/**
 * Album items are fetched for every album in one query, then grouped in
 * memory. This keeps the album listing at two queries instead of N+1.
 */

export interface AlbumItemRecord {
  id: string;
  album_id: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
}

export function groupAlbumItems<T extends AlbumItemRecord>(
  items: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const list = grouped.get(item.album_id);
    if (list) {
      list.push(item);
    } else {
      grouped.set(item.album_id, [item]);
    }
  }
  return grouped;
}
