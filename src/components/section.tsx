"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-24 md:py-32 px-4", className)}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-text font-display uppercase",
        className
      )}
    >
      {children}
    </motion.h2>
  );
}

export function SectionSubtitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "text-lg md:text-xl text-secondary-text max-w-2xl mt-4",
        className
      )}
    >
      {children}
    </motion.p>
  );
}
