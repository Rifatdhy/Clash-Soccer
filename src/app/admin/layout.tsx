"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Image,
  Newspaper,
  Settings,
  LogOut,
} from "lucide-react";
import { isAuthenticated, logout } from "@/lib/auth-store";
import AdminNavbar from "@/components/admin-navbar";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/matches", label: "Matches", icon: Calendar },
  { href: "/admin/rsvp", label: "RSVP", icon: ClipboardList },
  { href: "/admin/gallery", label: "Gallery", icon: Image },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!isAuthenticated() && pathname !== "/admin/login") {
    redirect("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen flex pt-16 md:pt-20">
        <aside className="hidden md:flex w-64 flex-col border-r border-border bg-charcoal fixed left-0 top-16 md:top-20 bottom-0">
        <div className="flex-1 py-6 px-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                pathname === link.href
                  ? "bg-elevated text-accent"
                  : "text-secondary-text hover:text-primary-text hover:bg-elevated/50"
              )}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
        </div>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-secondary-text hover:text-primary-text transition-colors w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-charcoal border-t border-border">
        <div className="flex justify-around py-2">
          {sidebarLinks.slice(0, 5).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
                pathname === link.href ? "text-accent" : "text-secondary-text"
              )}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

        <div className="flex-1 md:ml-64 pb-20 md:pb-0">
          <div className="p-6 md:p-8 max-w-6xl">{children}</div>
        </div>
      </div>
    </>
  );
}
