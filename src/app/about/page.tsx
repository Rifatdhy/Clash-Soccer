import type { Metadata } from "next";
import AboutView from "@/components/views/about-view";
import { fetchSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About — Clash.Soccer",
  description: "Tentang Clash.Soccer, komunitas mini soccer di Jakarta.",
};

export default async function AboutPage() {
  const settings = await fetchSettings();
  return <AboutView settings={settings} />;
}
