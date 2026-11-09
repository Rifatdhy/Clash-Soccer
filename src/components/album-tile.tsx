import Link from "next/link";
import Image from "next/image";
import { type Album } from "@/types";
import { formatDate } from "@/lib/format";
import { BrandFallback } from "./content-state";

interface AlbumTileProps {
  album: Album;
  aspect?: "wide" | "tall";
}

/**
 * One album as a cover-cropped photo tile.
 *
 * The frame crops the photo (`object-cover`) instead of letterboxing it, so
 * every tile is the same shape and the grid has no dead space. `aspect`
 * switches between the wide lead tile and the tall ones beside it.
 *
 * When the album lives on Google Drive the whole tile is a plain external
 * anchor — `next/link` would try to route it client-side and prefetch a
 * document it cannot render. Otherwise it is an in-app link to the album.
 * The hover zoom hangs off `group` on the link so the image, not the text,
 * carries the hover feedback — and because the tile is one link whose
 * accessible name is the concatenation of its text, the photo takes `alt=""`
 * rather than repeating the heading. The heading also brightens on hover, so
 * a tile with no cover still answers the pointer.
 */
export function AlbumTile({ album, aspect = "wide" }: AlbumTileProps) {
  const aspectClass = aspect === "tall" ? "aspect-[3/4]" : "aspect-[4/3]";

  const tile = (
    <>
      <div className={`relative overflow-hidden ${aspectClass}`}>
        {album.coverUrl ? (
          <Image
            src={album.coverUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <BrandFallback label="CLASH / MATCH DAY" />
        )}
      </div>
      <h3 className="mt-4 font-statement text-xl text-bone-dim transition-colors group-hover:text-bone">
        {album.title}
      </h3>
      <p className="mt-1 font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim">
        {formatDate(album.matchDate)}
      </p>
      <p className="mt-1 text-sm text-bone-dim">{album.items.length} media</p>
    </>
  );

  if (album.gdriveLink) {
    return (
      <a
        href={album.gdriveLink}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        {tile}
      </a>
    );
  }

  return (
    <Link href={`/gallery/${album.id}`} className="group block">
      {tile}
    </Link>
  );
}
