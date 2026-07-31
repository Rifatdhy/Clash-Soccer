"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { logout } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/rsvp", label: "RSVP" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pathname, setPathname] = useState("/admin");

  useEffect(() => {
    setPathname(window.location.pathname);
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const activeHref = useMemo(
    () => navLinks.find((link) => pathname === link.href)?.href ?? "/admin",
    [pathname]
  );

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-charcoal/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="Clash Soccer Logo"
            width={1024}
            height={1536}
            className="h-8 w-auto object-contain md:h-9"
          />
          <div className="min-w-0">
            <h1 className="truncate text-sm md:text-lg font-bold tracking-tight text-primary-text font-display leading-tight">
              CLASH.SOCCER
            </h1>
            <p className="text-[9px] md:text-[10px] uppercase tracking-[0.24em] text-accent leading-none">
              Admin Dashboard
            </p>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1 rounded-full border border-border bg-elevated/60 p-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors",
                activeHref === link.href
                  ? "bg-accent text-charcoal"
                  : "text-secondary-text hover:text-primary-text"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.18em] text-secondary-text transition-colors hover:border-accent/50 hover:text-primary-text"
          >
            View site
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.18em] text-secondary-text transition-colors hover:border-accent/50 hover:text-primary-text"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        <button
          onClick={() => setMobileMenuOpen((value) => !value)}
          className="inline-flex items-center justify-center rounded-full border border-border p-2 text-secondary-text transition-colors hover:border-accent hover:text-accent md:hidden"
          aria-label="Toggle admin menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-charcoal">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                    activeHref === link.href
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-elevated/40 text-secondary-text hover:text-primary-text"
                  )}
                >
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <Link
                href="/"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-elevated/40 px-4 py-3 text-sm text-secondary-text transition-colors hover:text-primary-text"
              >
                <span>View site</span>
                <span aria-hidden="true">→</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-elevated/40 px-4 py-3 text-sm text-secondary-text transition-colors hover:border-accent hover:text-accent"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
