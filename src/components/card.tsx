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
        "bg-surface border border-border p-6 md:p-8",
        hover && "transition-all duration-300 hover:bg-elevated",
        className
      )}
    >
      {children}
    </div>
  );
}
