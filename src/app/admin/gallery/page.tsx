"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X } from "lucide-react";
import Card from "@/components/card";
import { albums as initialAlbums } from "@/data/mock";

export default function AdminGallery() {
  const [albumList, setAlbumList] = useState(initialAlbums);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", matchDate: "" });

  const handleCreate = () => {
    if (!form.title || !form.matchDate) return;
    const newAlbum = {
      id: `a${Date.now()}`,
      title: form.title,
      matchDate: form.matchDate,
      coverUrl: "",
      items: [],
    };
    setAlbumList([newAlbum, ...albumList]);
    setShowCreate(false);
    setForm({ title: "", matchDate: "" });
  };

  const handleDelete = (id: string) => {
    setAlbumList(albumList.filter((a) => a.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text">Gallery</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Create Album
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {albumList.map((album, i) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="relative group">
              <button
                onClick={() => handleDelete(album.id)}
                className="absolute top-3 right-3 p-1.5 bg-charcoal/80 text-secondary-text hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
              <div className="aspect-[4/3] bg-elevated mb-4">
                <div className="w-full h-full bg-gradient-to-br from-elevated to-border" />
              </div>
              <h3 className="text-base font-semibold text-primary-text">{album.title}</h3>
              <p className="text-xs text-secondary-text mt-1">{album.items.length} items</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/80 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-primary-text">Create Album</h2>
                <button onClick={() => setShowCreate(false)} className="text-secondary-text hover:text-accent">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Album Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                />
                <input
                  type="date"
                  value={form.matchDate}
                  onChange={(e) => setForm({ ...form, matchDate: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text focus:outline-none focus:border-accent"
                />
                <div className="border-2 border-dashed border-border p-8 text-center">
                  <p className="text-sm text-secondary-text">Drop images here or click to upload</p>
                </div>
              </div>
              <button
                onClick={handleCreate}
                className="w-full mt-6 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Create Album
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
