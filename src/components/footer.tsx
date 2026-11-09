import Link from "next/link";
import Image from "next/image";
import type { Setting } from "@/types";
import { MessageCircle } from "lucide-react";
import { InstagramIcon } from "@/components/icons";

/**
 * Settings arrive from the server layout, so the description and contact links
 * are part of the first HTML response. There is no fetch here and therefore no
 * window where the footer shows placeholder copy.
 */
export default function Footer({ settings }: { settings: Setting }) {
  return (
    <footer className="border-t border-border bg-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link href="/" className="flex items-center gap-2 md:gap-3">
              <Image
                src="/logo.png"
                alt="Clash Soccer Logo"
                width={1024}
                height={1536}
                className="h-7 w-auto md:h-8 object-contain"
              />
              <span className="text-lg md:text-xl font-bold tracking-tight text-primary-text font-display">
                CLASH.<span className="text-secondary-text">SOCCER</span>
              </span>
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
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-secondary-text hover:text-primary-text transition-colors"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
              {settings.instagram && (
                <a
                  href={`https://instagram.com/${settings.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-secondary-text hover:text-primary-text transition-colors"
                >
                  <InstagramIcon size={16} />
                  Instagram
                </a>
              )}
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
