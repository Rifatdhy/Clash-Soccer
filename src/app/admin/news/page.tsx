"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, X } from "lucide-react";
import Card from "@/components/card";
import { news as initialNews, formatDate } from "@/data/mock";
import { type NewsItem } from "@/data/mock";

export default function AdminNews() {
  const [newsList, setNewsList] = useState(initialNews);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "" });

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", slug: "", content: "", excerpt: "" });
    setModalOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditing(item);
    setForm({ title: item.title, slug: item.slug, content: item.content, excerpt: item.excerpt });
    setModalOpen(true);
  };

  const handleSave = () => {
    const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, "-");
    if (editing) {
      setNewsList(newsList.map((n) => (n.id === editing.id ? { ...n, ...form, slug } : n)));
    } else {
      const newItem: NewsItem = {
        id: `n${Date.now()}`,
        ...form,
        slug,
        coverImage: "",
        date: new Date().toISOString().split("T")[0],
      };
      setNewsList([newItem, ...newsList]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setNewsList(newsList.filter((n) => n.id !== id));
  };

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
              className="bg-surface border border-border w-full max-w-lg p-6"
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
                <input
                  type="text"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Slug (auto-generated)"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                />
                <textarea
                  placeholder="Content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full mt-6 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                {editing ? "Update" : "Publish"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
