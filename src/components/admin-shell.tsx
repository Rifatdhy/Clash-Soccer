"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { isAuthenticated, logout } from "@/lib/auth-client";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/matches", label: "Matches", icon: Calendar },
  { href: "/admin/rsvp", label: "RSVP", icon: ClipboardList },
  { href: "/admin/gallery", label: "Gallery", icon: Image },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      if (pathname === "/admin/login") {
        setReady(true);
        return;
      }

      const authenticated = await isAuthenticated();

      if (!mounted) return;

      if (!authenticated) {
        window.location.href = "/admin/login";
        return;
      }

      setReady(true);
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  if (!ready) return null;

  if (pathname === "/admin/login") return <>{children}</>;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/admin/login";
  };

  return (
    <>
      <div className="min-h-screen bg-charcoal pt-0">
        <div className="lg:pl-0">
          <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:w-56 lg:flex-col lg:border-r lg:border-border/70 lg:bg-charcoal lg:px-4">
            <div className="flex-1 space-y-1 py-6">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    pathname === link.href
                      ? "bg-elevated text-primary-text"
                      : "text-secondary-text hover:bg-elevated/60 hover:text-primary-text"
                  )}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pb-6">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-secondary-text transition-colors hover:bg-elevated/60 hover:text-primary-text"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </aside>

          <main className="min-w-0 flex-1 pb-24 lg:ml-56 lg:pb-0">
            <div className="py-6 md:py-8 lg:px-6">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
