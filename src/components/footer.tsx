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
    <footer className="bg-ink border-t border-ink-line">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link href="/">
              <Image
                src="/logo-mark.png"
                alt="Clash Soccer"
                width={807}
                height={262}
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone-dim">
              {settings.description}
            </p>
          </div>

          <div>
            <h4 className="font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim mb-4">
              Navigate
            </h4>
            <div className="flex flex-col gap-3">
              {["Schedule", "Gallery", "News", "FAQ", "Contact"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-sm text-bone-dim hover:text-bone transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim mb-4">
              Connect
            </h4>
            <div className="flex flex-col gap-3">
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-bone-dim hover:text-bone transition-colors"
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
                  className="flex items-center gap-2 text-sm text-bone-dim hover:text-bone transition-colors"
                >
                  <InstagramIcon size={16} />
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-ink-line flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-bone-dim">
            &copy; {new Date().getFullYear()} Clash.Soccer. All rights reserved.
          </p>
          <p className="text-xs text-bone-dim">
            Less talk. More football.
          </p>
        </div>
      </div>
    </footer>
  );
}
