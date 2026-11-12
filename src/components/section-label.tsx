interface SectionLabelProps {
  children: React.ReactNode;
  as?: "h2" | "h3";
}

export function SectionLabel({ children, as = "h2" }: SectionLabelProps) {
  const Tag = as;

  return (
    <>
      <Tag className="font-condensed text-xs uppercase tracking-[0.18em] text-secondary-text">
        {children}
      </Tag>
      <span className="mt-3 block h-1 w-8 bg-crest" aria-hidden="true" />
    </>
  );
}
