import Image from "next/image";

interface BrandProps {
  compact?: boolean;
  inverted?: boolean;
}

export default function Brand({ compact = false, inverted = false }: BrandProps) {
  return (
    <span className="inline-flex items-center gap-3" aria-label="Clash.Soccer">
      <Image
        src="/logo.png"
        alt="Clash Soccer"
        width={1024}
        height={1536}
        className={compact ? "h-10 w-auto object-contain" : "h-12 w-auto object-contain"}
        priority
      />
      {!compact && <span className={`hidden border-l pl-3 font-condensed text-[9px] font-semibold uppercase tracking-[0.24em] sm:block ${inverted ? "border-ink-line text-bone-dim" : "border-border text-secondary-text"}`}>Soccer club</span>}
    </span>
  );
}
