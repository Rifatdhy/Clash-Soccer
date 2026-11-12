import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface border border-border/70 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:p-8",
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-text/15 hover:shadow-[0_12px_30px_rgba(29,29,31,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}
