import { cn } from "@/lib/utils";
import ScrollReveal from "./scroll-reveal";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  "data-home-schedule"?: boolean;
  spacing?: "tight" | "normal" | "loose";
}

const spacingClasses = {
  tight: "py-14 md:py-20",
  normal: "py-20 md:py-28",
  loose: "py-24 md:py-36",
} as const;

export default function Section({ children, className, id, spacing = "normal", "data-home-schedule": homeSchedule }: SectionProps) {
  return (
    <section id={id} data-home-schedule={homeSchedule || undefined} className={cn("px-5 md:px-8", spacingClasses[spacing], className)}>
      <ScrollReveal className="mx-auto max-w-7xl">{children}</ScrollReveal>
    </section>
  );
}
