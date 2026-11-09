import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  spacing?: "tight" | "normal" | "loose";
}

const spacingClasses = {
  tight: "py-14 md:py-20",
  normal: "py-20 md:py-28",
  loose: "py-24 md:py-36",
} as const;

export default function Section({ children, className, id, spacing = "normal" }: SectionProps) {
  return (
    <section id={id} className={cn("px-4", spacingClasses[spacing], className)}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}
