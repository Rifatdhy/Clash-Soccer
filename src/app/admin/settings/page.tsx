"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import Card from "@/components/card";
import { getSettings, updateSettings, getFaqs, createFaq, updateFaq as updateFaqStore, deleteFaq } from "@/lib/settings-store";
import { uploadImageFile } from "@/lib/upload-image";
import type { FaqItem, Setting } from "@/types";

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting | null>(null);
  const [faqList, setFaqList] = useState<FaqItem[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat pengaturan.");
      });

    getFaqs()
      .then(setFaqList)
      .catch((err) => {
        console.error("Failed to load FAQs:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat FAQ.");
        setFaqList([]);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logoUrl" | "bannerUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setError(null);
    try {
      const url = await uploadImageFile(file);
      setSettings((current) => (current ? { ...current, [field]: url } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses gambar.");
    }
  };

  const addFaq = async () => {
    setError(null);
    try {
      const newFaq: FaqItem = {
        id: `f${Date.now()}`,
        question: "",
        answer: "",
      };
      setFaqList(await createFaq(newFaq));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah FAQ.");
    }
  };

  const updateFaqDraft = (id: string, field: "question" | "answer", value: string) => {
    setFaqList((current) =>
      current
        ? current.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq))
        : current
    );
  };

  const saveFaqField = async (
    faq: FaqItem,
    field: "question" | "answer"
  ) => {
    setError(null);
    try {
      setFaqList(await updateFaqStore(faq.id, { [field]: faq[field] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan FAQ.");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus FAQ ini?")) return;
    setError(null);
    try {
      setFaqList(await deleteFaq(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus FAQ.");
    }
  };

  if (!faqList || !settings) {
    if (error) {
      return (
        <div role="alert" className="p-4 border border-red-500/20 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      );
    }
    return (
      <div className="flex min-h-[280px] items-center justify-center" role="status">
        <p className="text-sm uppercase tracking-[0.18em] text-secondary-text">
          Memuat pengaturan...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text mb-8">Settings</h1>

      <div className="space-y-8 max-w-2xl">
        <Card hover={false}>
          <h2 className="text-lg font-semibold text-primary-text mb-6">General Information</h2>
          <div className="space-y-4">
            <input
              type="text"
              aria-label="Community Name"
              placeholder="Community Name"
              value={settings.communityName}
              onChange={(e) => setSettings({ ...settings, communityName: e.target.value })}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
            />
            <textarea
              aria-label="Description"
              placeholder="Description"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              rows={3}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent resize-none"
            />
            <div>
              <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                Logo Komunitas
              </label>
              <div className="flex gap-4 items-center">
                <div className="relative w-16 h-16 bg-elevated border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {settings.logoUrl ? (
                    <Image src={settings.logoUrl} alt="Logo" fill sizes="4rem" className="object-cover" />
                  ) : (
                    <span className="text-[10px] text-secondary-text">No Logo</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "logoUrl")}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="inline-block px-3 py-1.5 border border-border text-xs text-primary-text hover:bg-elevated cursor-pointer transition-colors uppercase tracking-wider"
                  >
                    Pilih File Logo
                  </label>
                  <input
                    type="text"
                    aria-label="URL Logo"
                    placeholder="Atau masukkan URL Logo"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="w-full bg-elevated border border-border px-3 py-2 text-xs text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                Banner Komunitas
              </label>
              <div className="flex gap-4 items-center">
                <div className="relative w-28 h-16 bg-elevated border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {settings.bannerUrl ? (
                    <Image src={settings.bannerUrl} alt="Banner" fill sizes="7rem" className="object-cover" />
                  ) : (
                    <span className="text-[10px] text-secondary-text">No Banner</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "bannerUrl")}
                    className="hidden"
                    id="banner-upload"
                  />
                  <label
                    htmlFor="banner-upload"
                    className="inline-block px-3 py-1.5 border border-border text-xs text-primary-text hover:bg-elevated cursor-pointer transition-colors uppercase tracking-wider"
                  >
                    Pilih File Banner
                  </label>
                  <input
                    type="text"
                    aria-label="URL Banner"
                    placeholder="Atau masukkan URL Banner"
                    value={settings.bannerUrl}
                    onChange={(e) => setSettings({ ...settings, bannerUrl: e.target.value })}
                    className="w-full bg-elevated border border-border px-3 py-2 text-xs text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <h2 className="text-lg font-semibold text-primary-text mb-6">Contact</h2>
          <div className="space-y-4">
            <input
              type="text"
              aria-label="WhatsApp Number"
              placeholder="WhatsApp Number"
              value={settings.whatsapp}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              aria-label="Instagram Username"
              placeholder="Instagram Username"
              value={settings.instagram}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              aria-label="Location"
              placeholder="Location"
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              aria-label="Google Maps Embed URL"
              placeholder="Google Maps Embed URL"
              value={settings.googleMapsEmbed}
              onChange={(e) => setSettings({ ...settings, googleMapsEmbed: e.target.value })}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
            />
          </div>
        </Card>

        <Card hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-primary-text">FAQ</h2>
            <button
              onClick={addFaq}
              className="flex items-center gap-1 text-xs uppercase tracking-widest text-secondary-text hover:text-accent transition-colors"
            >
              <Plus size={14} /> Add FAQ
            </button>
          </div>
          <div className="space-y-4">
            {faqList.map((faq) => (
              <div key={faq.id} className="border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      aria-label="Pertanyaan FAQ"
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) => updateFaqDraft(faq.id, "question", e.target.value)}
                      onBlur={() => saveFaqField(faq, "question")}
                      className="w-full bg-elevated border border-border px-3 py-2 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                    />
                    <textarea
                      aria-label="Jawaban FAQ"
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={(e) => updateFaqDraft(faq.id, "answer", e.target.value)}
                      onBlur={() => saveFaqField(faq, "answer")}
                      rows={2}
                      className="w-full bg-elevated border border-border px-3 py-2 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    aria-label="Hapus FAQ"
                    className="p-1 text-secondary-text hover:text-accent transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {error && (
          <div role="alert" className="p-4 border border-red-500/20 bg-red-500/10 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
