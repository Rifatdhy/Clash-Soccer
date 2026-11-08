"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Card from "@/components/card";
import { formatDate } from "@/lib/format";
import type { NewsItem } from "@/types";
import { getNews, createNews, updateNews, deleteNews } from "@/lib/news-store";
import { compressImageFile } from "@/lib/image-compress";
import Modal from "@/components/ui/modal";

export default function AdminNews() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", coverImage: "" });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    try {
      const news = await getNews();
      setNewsList(news);
    } catch (err) {
      console.error("Error loading news:", err);
      setError("Gagal memuat daftar berita.");
    } finally {
      setLoading(false);
    }
  }

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", slug: "", content: "", excerpt: "", coverImage: "" });
    setModalOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditing(item);
    setForm({ 
      title: item.title, 
      slug: item.slug, 
      content: item.content, 
      excerpt: item.excerpt,
      coverImage: item.coverImage || ""
    });
    setModalOpen(true);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const compressed = await compressImageFile(file);
      setForm((current) => ({ ...current, coverImage: compressed }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses gambar.");
    }
  };

  async function handleSave() {
    setError(null);

    // Validation
    if (!form.title.trim()) {
      setError("Judul harus diisi.");
      return;
    }
    if (!form.content.trim()) {
      setError("Konten harus diisi.");
      return;
    }

    const slug =
      form.slug.trim() ||
      form.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");

    try {
      if (editing) {
        await updateNews(editing.id, { ...form, slug });
      } else {
        await createNews({
          id: `n${Date.now()}`,
          ...form,
          slug,
          coverImage: form.coverImage || "",
          date: new Date().toISOString().split("T")[0],
        });
      }
      await loadNews();
      setModalOpen(false);
    } catch (err) {
      console.error("Error saving news:", err);
      setError(err instanceof Error ? err.message : "Gagal menyimpan berita.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus news ini?")) return;
    try {
      await deleteNews(id);
      await loadNews();
    } catch (err) {
      console.error("Error deleting news:", err);
      setError("Gagal menghapus berita. Silakan coba lagi.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-secondary-text">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text">News</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add News
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 border border-red-500/20 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Title</th>
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Date</th>
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Status</th>
                <th className="text-right py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {newsList.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-elevated/30 transition-colors"
                >
                  <td className="py-3 px-4 text-primary-text">{item.title}</td>
                  <td className="py-3 px-4 text-secondary-text">{formatDate(item.date)}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs uppercase tracking-widest text-accent">Published</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className="p-1 text-secondary-text hover:text-accent transition-colors">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} aria-label={`Hapus ${item.title}`} className="p-1 text-secondary-text hover:text-accent transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        labelledBy="news-modal-title"
        className="max-w-lg max-h-[90vh] overflow-y-auto p-6"
      >
              <div className="flex items-center justify-between mb-6">
                <h2 id="news-modal-title" className="text-lg font-bold text-primary-text">
                  {editing ? "Edit News" : "Add News"}
                </h2>
                <button onClick={() => setModalOpen(false)} aria-label="Tutup form berita" className="text-secondary-text hover:text-accent">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="news-title" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Judul <span className="text-accent">*</span>
                  </label>
                  <input
                    id="news-title"
                    type="text"
                    placeholder="e.g. Clash Weekly Edisi #50"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="news-slug" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Slug <span className="text-secondary-text/60 font-normal normal-case">(auto-generated dari judul)</span>
                  </label>
                  <input
                    id="news-slug"
                    type="text"
                    placeholder="clash-weekly-edisi-50"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="news-cover-upload" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Cover Image / Thumbnail
                  </label>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="relative border-2 border-dashed border-border hover:border-accent/50 transition-colors cursor-pointer"
                  >
                    {form.coverImage ? (
                      <div className="relative h-48 overflow-hidden rounded-sm">
                        <Image
                          src={form.coverImage}
                          alt="cover"
                          fill
                          className="object-contain p-2"
                        />
                        <div className="absolute inset-0 bg-charcoal/0 hover:bg-charcoal/40 transition-colors flex items-center justify-center">
                          <span className="text-xs uppercase tracking-wider text-primary-text opacity-0 hover:opacity-100 transition-opacity">
                            Ganti Foto
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm({ ...form, coverImage: "" });
                          }}
                          aria-label="Hapus cover image"
                          className="absolute top-2 right-2 p-1.5 bg-charcoal/80 text-secondary-text hover:text-accent transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 gap-2">
                        <ImageIcon size={24} className="text-secondary-text" />
                        <span className="text-sm text-secondary-text">Klik untuk upload cover image</span>
                        <span className="text-xs text-secondary-text/50">atau paste URL di bawah</span>
                        <span className="text-[10px] text-secondary-text/40">Max 10MB • JPG, PNG, GIF</span>
                      </div>
                    )}
                    <input
                      id="news-cover-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                  </div>
                  <input
                    type="url"
                    aria-label="URL cover image"
                    placeholder="Atau paste URL gambar di sini..."
                    value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    className="w-full bg-elevated border border-t-0 border-border px-4 py-2.5 text-xs text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="news-excerpt" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Excerpt / Ringkasan
                  </label>
                  <textarea
                    id="news-excerpt"
                    placeholder="Ringkasan singkat artikel (1-2 kalimat)"
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    rows={2}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                  <p className="text-[10px] text-secondary-text/60 mt-1">
                    {form.excerpt.length} karakter
                  </p>
                </div>

                <div>
                  <label htmlFor="news-content" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Konten <span className="text-accent">*</span>
                  </label>
                  <textarea
                    id="news-content"
                    placeholder="Tulis konten artikel lengkap di sini..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={8}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                  <p className="text-[10px] text-secondary-text/60 mt-1">
                    {form.content.split(' ').filter(w => w.length > 0).length} kata
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-border text-secondary-text text-sm font-medium uppercase tracking-widest hover:bg-elevated transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title || !form.content}
                  className="flex-1 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {editing ? "Update" : "Publish"}
                </button>
              </div>
      </Modal>
    </div>
  );
}
