interface SectionLabelProps {
  children: React.ReactNode;
  as?: "h2" | "h3";
}

export function SectionLabel({ children, as = "h2" }: SectionLabelProps) {
  const Tag = as;

  return (
    <>
      <Tag className="font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim">
        {children}
      </Tag>
      <span className="mt-2 block h-0.5 w-10 bg-crest" aria-hidden="true" />
    </>
  );
}
