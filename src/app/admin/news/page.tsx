"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Card from "@/components/card";
import { formatDate } from "@/lib/format";
import type { NewsItem } from "@/types";
import { getNews, createNews, updateNews, deleteNews } from "@/lib/news-store";

export default function AdminNews() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", coverImage: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    try {
      const news = await getNews();
      setNewsList(news);
    } catch (error) {
      console.error("Error loading news:", error);
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

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, coverImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  async function handleSave() {
    // Validation
    if (!form.title.trim()) {
      alert('Judul harus diisi');
      return;
    }
    if (!form.excerpt.trim()) {
      alert('Excerpt harus diisi');
      return;
    }
    if (!form.content.trim()) {
      alert('Konten harus diisi');
      return;
    }
    
    const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      if (editing) {
        await updateNews(editing.id, { ...form, slug });
      } else {
        const newItem = {
          id: `n${Date.now()}`,
          ...form,
          slug,
          coverImage: form.coverImage || "",
          date: new Date().toISOString().split("T")[0],
        };
        await createNews(newItem);
      }
      await loadNews();
      setModalOpen(false);
    } catch (error) {
      console.error("Error saving news:", error);
      alert("Gagal menyimpan news. Silakan coba lagi.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus news ini?")) return;
    try {
      await deleteNews(id);
      await loadNews();
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("Gagal menghapus news. Silakan coba lagi.");
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
                      <button onClick={() => openEdit(item)} className="p-1 text-secondary-text hover:text-accent transition-colors">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-secondary-text hover:text-accent transition-colors">
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

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/80 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-primary-text">
                  {editing ? "Edit News" : "Add News"}
                </h2>
                <button onClick={() => setModalOpen(false)} className="text-secondary-text hover:text-accent">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Judul <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clash Weekly Edisi #50"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Slug <span className="text-secondary-text/60 font-normal normal-case">(auto-generated dari judul)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="clash-weekly-edisi-50"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Cover Image / Thumbnail
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
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
                        <span className="text-[10px] text-secondary-text/40">Max 5MB • JPG, PNG, GIF</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                  </div>
                  <input
                    type="url"
                    placeholder="Atau paste URL gambar di sini..."
                    value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    className="w-full bg-elevated border border-t-0 border-border px-4 py-2.5 text-xs text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Excerpt / Ringkasan <span className="text-accent">*</span>
                  </label>
                  <textarea
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
                  <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Konten <span className="text-accent">*</span>
                  </label>
                  <textarea
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
                  disabled={!form.title || !form.excerpt || !form.content}
                  className="flex-1 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {editing ? "Update" : "Publish"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}