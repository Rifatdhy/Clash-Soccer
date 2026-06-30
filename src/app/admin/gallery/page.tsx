"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Video } from "lucide-react";
import Card from "@/components/card";
import { albums as initialAlbums } from "@/data/mock";
import { type Album, type GalleryItem } from "@/data/mock";

export default function AdminGallery() {
  const [albumList, setAlbumList] = useState(initialAlbums);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", matchDate: "", coverUrl: "" });
  const [managingId, setManagingId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ type: "image" as "image" | "video", url: "" });

  const managingAlbum = managingId ? albumList.find((a) => a.id === managingId) ?? null : null;

  const handleCreate = () => {
    if (!form.title || !form.matchDate) return;
    const newAlbum: Album = {
      id: `a${Date.now()}`,
      title: form.title,
      matchDate: form.matchDate,
      coverUrl: form.coverUrl,
      items: [],
    };
    setAlbumList([newAlbum, ...albumList]);
    setShowCreate(false);
    setForm({ title: "", matchDate: "", coverUrl: "" });
  };

  const handleDelete = (id: string) => {
    if (managingId === id) setManagingId(null);
    setAlbumList(albumList.filter((a) => a.id !== id));
  };

  const updateCoverUrl = (albumId: string, url: string) => {
    setAlbumList(albumList.map((a) => (a.id === albumId ? { ...a, coverUrl: url } : a)));
  };

  const addItem = (albumId: string) => {
    if (!itemForm.url) return;
    const newItem: GalleryItem = {
      id: `g${Date.now()}`,
      type: itemForm.type,
      url: itemForm.url,
    };
    setAlbumList(albumList.map((a) => (a.id === albumId ? { ...a, items: [...a.items, newItem] } : a)));
    setItemForm({ type: "image", url: "" });
  };

  const deleteItem = (albumId: string, itemId: string) => {
    setAlbumList(albumList.map((a) => (a.id === albumId ? { ...a, items: a.items.filter((i) => i.id !== itemId) } : a)));
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
            <div className="cursor-pointer" onClick={() => setManagingId(album.id)}>
              <Card className="relative group">
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(album.id); }}
                className="absolute top-3 right-3 z-10 p-1.5 bg-charcoal/80 text-secondary-text hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
              <div className="aspect-[4/3] bg-elevated mb-4 overflow-hidden">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-elevated to-border" />
                )}
              </div>
              <h3 className="text-base font-semibold text-primary-text">{album.title}</h3>
              <p className="text-xs text-secondary-text mt-1">{album.items.length} items</p>
            </Card>
            </div>
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
                <input
                  type="text"
                  placeholder="Cover Image URL (optional)"
                  value={form.coverUrl}
                  onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                />
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

      <AnimatePresence>
        {managingAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/80 flex items-center justify-center p-4"
            onClick={() => setManagingId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-primary-text">{managingAlbum.title}</h2>
                <button onClick={() => setManagingId(null)} className="text-secondary-text hover:text-accent">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">Cover Image URL</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={managingAlbum.coverUrl}
                    onChange={(e) => updateCoverUrl(managingAlbum.id, e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="flex-1 bg-elevated border border-border px-4 py-2.5 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                  />
                  {managingAlbum.coverUrl && (
                    <div className="w-12 h-12 bg-elevated border border-border overflow-hidden shrink-0">
                      <img src={managingAlbum.coverUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-secondary-text mb-3">
                  Items ({managingAlbum.items.length})
                </label>
                {managingAlbum.items.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {managingAlbum.items.map((item) => (
                      <div key={item.id} className="relative group/item aspect-[4/3] bg-elevated border border-border overflow-hidden">
                        {item.url && item.type === "image" ? (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        ) : item.url && item.type === "video" ? (
                          <div className="w-full h-full bg-gradient-to-br from-elevated to-border flex items-center justify-center">
                            <Video size={20} className="text-secondary-text" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-elevated to-border" />
                        )}
                        <button
                          onClick={() => deleteItem(managingAlbum.id, item.id)}
                          className="absolute top-1 right-1 p-1 bg-charcoal/80 text-secondary-text hover:text-accent opacity-0 group-hover/item:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-text">No items yet. Add one below.</p>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <label className="block text-xs uppercase tracking-widest text-secondary-text mb-3">Add Item</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={itemForm.type}
                    onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as "image" | "video" })}
                    className="bg-elevated border border-border px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <input
                    type="text"
                    placeholder="https://example.com/photo.jpg"
                    value={itemForm.url}
                    onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                    className="flex-1 bg-elevated border border-border px-4 py-2.5 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => addItem(managingAlbum.id)}
                    disabled={!itemForm.url}
                    className="px-6 py-2.5 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
