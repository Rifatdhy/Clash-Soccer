"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import Card from "@/components/card";
import { type FaqItem, type Setting } from "@/data/mock";
import { getSettings, updateSettings, getFaqs, createFaq, updateFaq as updateFaqStore, deleteFaq } from "@/lib/settings-store";

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting | null>(null);
  const [faqList, setFaqList] = useState<FaqItem[] | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
    getFaqs().then(setFaqList);
  }, []);

  const handleSave = () => {
    if (!settings) return;
    updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addFaq = async () => {
    const newFaq: FaqItem = {
      id: `f${Date.now()}`,
      question: "",
      answer: "",
    };
    setFaqList(await createFaq(newFaq));
  };

  const handleUpdateFaq = async (id: string, field: "question" | "answer", value: string) => {
    setFaqList(await updateFaqStore(id, field, value));
  };

  const handleDeleteFaq = async (id: string) => {
    setFaqList(await deleteFaq(id));
  };

  if (!faqList || !settings) return null;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text mb-8">Settings</h1>

      <div className="space-y-8 max-w-2xl">
        <Card hover={false}>
          <h2 className="text-lg font-semibold text-primary-text mb-6">General Information</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Community Name"
              value={settings.communityName}
              onChange={(e) => setSettings({ ...settings, communityName: e.target.value })}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
            />
            <textarea
              placeholder="Description"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              rows={3}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent resize-none"
            />
            <div className="border-2 border-dashed border-border p-6 text-center">
              <p className="text-sm text-secondary-text">Upload Logo</p>
            </div>
            <div className="border-2 border-dashed border-border p-6 text-center">
              <p className="text-sm text-secondary-text">Upload Banner</p>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <h2 className="text-lg font-semibold text-primary-text mb-6">Contact</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="WhatsApp Number"
              value={settings.whatsapp}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              placeholder="Instagram Username"
              value={settings.instagram}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              placeholder="Location"
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
            />
            <input
              type="text"
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
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) => handleUpdateFaq(faq.id, "question", e.target.value)}
                      className="w-full bg-elevated border border-border px-3 py-2 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                    />
                    <textarea
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={(e) => handleUpdateFaq(faq.id, "answer", e.target.value)}
                      rows={2}
                      className="w-full bg-elevated border border-border px-3 py-2 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-1 text-secondary-text hover:text-accent transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
