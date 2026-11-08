import type { Metadata } from "next";
import ContactView from "@/components/views/contact-view";
import { fetchSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact — Clash.Soccer",
  description: "Hubungi Clash.Soccer melalui WhatsApp atau Instagram.",
};

export default async function ContactPage() {
  const settings = await fetchSettings();
  return <ContactView settings={settings} />;
}
