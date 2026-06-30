import Link from "next/link";
import { settings } from "@/data/mock";
import { MessageCircle } from "lucide-react";

function InstagramIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight text-primary-text font-display">
              CLASH.<span className="text-secondary-text">SOCCER</span>
            </Link>
            <p className="mt-4 text-sm text-secondary-text leading-relaxed max-w-xs">
              {settings.description}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-secondary-text mb-4">
              Navigate
            </h4>
            <div className="flex flex-col gap-3">
              {["Schedule", "Gallery", "News", "FAQ", "Contact"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-sm text-secondary-text hover:text-primary-text transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-secondary-text mb-4">
              Connect
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-secondary-text hover:text-primary-text transition-colors"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-secondary-text hover:text-primary-text transition-colors"
              >
                <InstagramIcon size={16} />
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-secondary-text">
            &copy; {new Date().getFullYear()} Clash.Soccer. All rights reserved.
          </p>
          <p className="text-xs text-secondary-text">
            Less talk. More football.
          </p>
        </div>
      </div>
    </footer>
  );
}
