import { cn } from "@/lib/utils";

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
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}
