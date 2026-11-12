import type { Album, AlbumItem } from "@/types";

/**
 * A video tile opens the source URL in a new tab. Images stay in the lightbox,
 * so they have no href.
 */
export function videoItemHref(item: Pick<AlbumItem, "type" | "url">): string | null {
  return item.type === "video" && item.url ? item.url : null;
}

/**
 * Albums always keep a detail page. The Drive button lives there, so a Drive
 * album is still browsable instead of leaving the site on first click.
 */
export function albumDetailHref(album: Pick<Album, "id">): string {
  return `/gallery/${album.id}`;
}
