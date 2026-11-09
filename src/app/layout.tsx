import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald, Instrument_Serif, Barlow_Condensed } from "next/font/google";
import LayoutContent from "@/components/layout-content";
import { fetchSettings } from "@/lib/data";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { getSiteUrl } from "@/lib/seo";
import type { Setting } from "@/types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Clash.Soccer — Less Talk. More Football.",
  description:
    "Komunitas mini soccer — informasi jadwal, RSVP, galeri, dan berita dalam satu platform modern.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Clash.Soccer",
    description: "Komunitas mini soccer modern.",
  },
};

/**
 * The footer shows community settings. Reading them here means the description
 * and contact links are in the first HTML response instead of appearing after
 * a client-side fetch. A database hiccup falls back to brand defaults so the
 * layout never fails to render, and the build phase skips the query entirely
 * because `npm run build` must not require a database.
 */
async function loadSettings(): Promise<Setting> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return DEFAULT_SETTINGS;
  }

  try {
    return await fetchSettings();
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await loadSettings();

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} ${instrumentSerif.variable} ${barlowCondensed.variable}`}
    >
      <body className="bg-charcoal text-primary-text font-sans antialiased min-h-screen flex flex-col">
        <LayoutContent settings={settings}>{children}</LayoutContent>
      </body>
    </html>
  );
}
