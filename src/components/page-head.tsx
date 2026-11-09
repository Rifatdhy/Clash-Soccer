interface PageHeadProps {
  title: string;
  subtitle?: string;
  meta?: string;
}

export function PageHead({ title, subtitle, meta }: PageHeadProps) {
  return (
    <header className="border-b border-ink-line">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-28 md:pt-32">
        {meta && (
          <p className="font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim">{meta}</p>
        )}
        <h1 className="mt-3 font-statement text-4xl leading-[1.05] text-bone md:text-6xl">
          {title}
        </h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base text-bone-dim md:text-lg">{subtitle}</p>}
      </div>
    </header>
  );
}
