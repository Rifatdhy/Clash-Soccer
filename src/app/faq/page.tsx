import type { Metadata } from "next";
import FaqView from "@/components/views/faq-view";
import { fetchFaqs } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ — Clash.Soccer",
  description: "Pertanyaan yang sering diajukan tentang Clash.Soccer.",
};

export default async function FAQPage() {
  const faqs = await fetchFaqs();
  return <FaqView faqs={faqs} />;
}
