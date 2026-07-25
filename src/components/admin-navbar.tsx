"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { logout } from "@/lib/auth-store";

export default function AdminNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-sm border-b border-border">
      <div className="px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Logo & Admin Badge */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <LayoutDashboard size={20} className="text-accent" />
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-primary-text font-display">
                CLASH.SOCCER
              </h1>
              <p className="text-[10px] text-accent uppercase tracking-widest">Admin Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            target="_blank"
            className="text-xs uppercase tracking-widest text-secondary-text hover:text-accent transition-colors"
          >
            View Site →
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest text-secondary-text hover:text-primary-text border border-border hover:border-accent/50 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-secondary-text hover:text-accent transition-colors"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-charcoal">
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-secondary-text hover:text-accent transition-colors"
            >
              View Site →
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 text-sm text-secondary-text hover:text-accent transition-colors w-full"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}