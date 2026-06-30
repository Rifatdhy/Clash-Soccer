import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
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

export const metadata: Metadata = {
  title: "Clash.Soccer — Less Talk. More Football.",
  description: "Komunitas mini soccer — informasi jadwal, RSVP, galeri, dan berita dalam satu platform modern.",
  openGraph: {
    title: "Clash.Soccer",
    description: "Komunitas mini soccer modern.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable}`}>
      <body className="bg-charcoal text-primary-text font-sans antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
