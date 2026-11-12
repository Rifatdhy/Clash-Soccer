"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowUpRight } from "lucide-react";
import Brand from "./brand";
import type { Match } from "@/types";
import { nextGameAction } from "@/lib/next-game-action";

const links = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/gallery", label: "Gallery" },
  { href: "/news", label: "News" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar({ nextMatch }: { nextMatch: Match | null }) {
  const action = nextGameAction(nextMatch);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled || !isHome
            ? "bg-charcoal/95 backdrop-blur-md border-b border-border shadow-[0_1px_0_rgba(20,33,36,0.04)]"
            : "bg-charcoal/85 backdrop-blur-sm"
        )}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="inline-flex items-center py-2">
              <Brand />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex min-h-11 items-center font-condensed text-sm uppercase tracking-[0.14em] transition-colors duration-300",
                      pathname === link.href
                        ? "text-primary-text"
                        : "text-secondary-text hover:text-primary-text"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={action.href}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 font-condensed text-xs uppercase tracking-[0.16em] text-charcoal transition-all hover:bg-crest-hover hover:shadow-[0_4px_12px_rgba(127,29,50,0.24)]"
              >
                {action.label} <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-primary-text p-3"
              aria-label="Menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? (
                <X size={24} aria-hidden="true" />
              ) : (
              <Menu size={22} strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-charcoal md:hidden"
          >
            <div className="flex h-full flex-col items-center justify-center gap-10">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-statement text-4xl text-primary-text py-3"
                >
                  {link.label}
                </Link>
              ))}
              <Link href={action.href} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 py-4 font-condensed text-sm uppercase tracking-[0.16em] text-charcoal">
                {action.label} <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
