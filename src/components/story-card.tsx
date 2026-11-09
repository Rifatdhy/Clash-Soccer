import Link from "next/link";
import Image from "next/image";
import { type NewsItem } from "@/types";
import { formatDate } from "@/lib/format";
import { BrandFallback } from "./content-state";

interface StoryCardProps {
  item: NewsItem;
  featured?: boolean;
}

/**
 * One story in the news list, in two shapes.
 *
 * `featured` is the lead story: a cropped 16:9 photo, a large statement
 * headline and a single line of excerpt. Everything else is a compact row —
 * date on the left, headline on the right, no image — so a long list stays
 * scannable instead of repeating the same three-up card grid.
 *
 * The whole card is the link, so the surface is the affordance and the
 * accessible name is the readable headline rather than a chain of fragments.
 * For the same reason the photo carries `alt=""`: the headline beside it is
 * the label, so a descriptive alt would make the link announce the title
 * twice, and the photo adds nothing the text does not already say.
 * The title is an `h3` in both shapes: the pages that host this card already
 * own the single `h1` (via `PageHead`) and any `h2` section headings.
 */
export function StoryCard({ item, featured = false }: StoryCardProps) {
  if (!featured) {
    return (
      <Link
        href={`/news/${item.slug}`}
        className="grid grid-cols-1 gap-1 border-b border-ink-line py-5 transition-transform duration-200 hover:-translate-y-0.5 md:grid-cols-[9rem_1fr] md:items-baseline md:gap-6"
      >
        <p className="font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim">
          {formatDate(item.date)}
        </p>
        <h3 className="font-statement text-lg text-bone">{item.title}</h3>
      </Link>
    );
  }

  return (
    <Link href={`/news/${item.slug}`} className="block">
      <div className="relative aspect-[16/9] overflow-hidden">
        {item.coverImage ? (
          <Image
            src={item.coverImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover"
          />
        ) : (
          <BrandFallback label="CLASH / NEWS" />
        )}
      </div>
      <p className="mt-5 font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim">
        {formatDate(item.date)}
      </p>
      <h3 className="mt-2 font-statement text-2xl md:text-4xl text-bone">{item.title}</h3>
      {item.excerpt && <p className="mt-3 line-clamp-1 text-bone-dim">{item.excerpt}</p>}
    </Link>
  );
}
