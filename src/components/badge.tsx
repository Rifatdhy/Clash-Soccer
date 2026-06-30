import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "upcoming" | "ongoing" | "completed";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = "upcoming", children, className }: BadgeProps) {
  const styles = {
    upcoming: "border border-border text-primary-text",
    ongoing: "border border-accent text-accent",
    completed: "border border-border text-secondary-text",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-widest font-display",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
