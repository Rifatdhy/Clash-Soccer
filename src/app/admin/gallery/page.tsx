"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Trash2, X, Video, ExternalLink, Upload } from "lucide-react";
import Card from "@/components/card";
import { type Album } from "@/types";
import { getAlbums, createAlbum, deleteAlbum, updateAlbum, addItem, deleteItem } from "@/lib/album-store";
import { uploadImageFile } from "@/lib/upload-image";
import DatePicker from "@/components/date-picker";
import Modal from "@/components/ui/modal";

export default function AdminGallery() {
  const [albumList, setAlbumList] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", matchDate: "", coverUrl: "", gdriveLink: "" });
  const [managingId, setManagingId] = useState<string | null>(null);
  const [manageDraft, setManageDraft] = useState({ coverUrl: "", gdriveLink: "" });
  const [itemForm, setItemForm] = useState({ type: "image" as "image" | "video", url: "" });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAlbums()
      .then(setAlbumList)
      .catch(() => {
        setError("Gagal memuat album.");
      })
      .finally(() => setLoading(false));
  }, []);

  const managingAlbum = managingId ? albumList.find((a) => a.id === managingId) ?? null : null;

  const openManage = (album: Album) => {
    setManageDraft({
      coverUrl: album.coverUrl,
      gdriveLink: album.gdriveLink ?? "",
    });
    setManagingId(album.id);
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      setForm((current) => ({ ...current, coverUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses gambar.");
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.matchDate) return;
    setError(null);
    try {
      setAlbumList(
        await createAlbum({
          id: `a${Date.now()}`,
          title: form.title,
          matchDate: form.matchDate,
          coverUrl: form.coverUrl,
          gdriveLink: form.gdriveLink || undefined,
        })
      );
      setShowCreate(false);
      setForm({ title: "", matchDate: "", coverUrl: "", gdriveLink: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat album.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus album ini beserta isinya?")) return;
    setError(null);
    try {
      setAlbumList(await deleteAlbum(id));
      if (managingId === id) setManagingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus album.");
    }
  };

  const handleUpdateField = async (
    album: Album,
    field: "coverUrl" | "gdriveLink",
    value: string
  ) => {
    if ((album[field] ?? "") === value) return;
    setError(null);
    try {
      setAlbumList(await updateAlbum(album.id, { [field]: value }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan album.");
    }
  };

  const handleAddItem = async (albumId: string) => {
    if (!itemForm.url.trim()) return;
    setError(null);
    try {
      const updatedAlbum = await addItem(albumId, {
        type: itemForm.type,
        url: itemForm.url.trim(),
      });
      setAlbumList((prev) => prev.map((a) => (a.id === albumId ? updatedAlbum : a)));
      setItemForm({ type: "image", url: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah item.");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Yakin ingin menghapus item ini?")) return;
    setError(null);
    try {
      const updatedAlbum = await deleteItem(itemId);
      setAlbumList((prev) =>
        prev.map((a) => (a.id === updatedAlbum.id ? updatedAlbum : a))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus item.");
    }
  };

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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text">Gallery</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Create Album
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 border border-red-500/20 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      )}

      {albumList.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-secondary-text">Belum ada album. Buat album pertama!</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {albumList.map((album, i) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              role="button"
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => openManage(album)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openManage(album);
                }
              }}
            >
              <Card className="relative group">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(album.id); }}
                  aria-label={`Hapus album ${album.title}`}
                  className="absolute top-3 right-3 z-10 p-1.5 bg-charcoal/80 text-secondary-text hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
                <div className="aspect-[4/3] bg-elevated mb-4 overflow-hidden relative rounded-sm">
                  {album.coverUrl ? (
                    <Image
                      src={album.coverUrl}
                      alt={album.title}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-elevated to-border" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-primary-text">{album.title}</h3>
              <p className="text-xs text-secondary-text mt-1">{album.items.length} items</p>
              {album.gdriveLink && (
                <p className="text-xs text-accent mt-1 flex items-center gap-1">
                  <ExternalLink size={10} /> GDrive attached
                </p>
              )}
            </Card>
            </div>
          </motion.div>
        ))}
      </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        labelledBy="album-modal-title"
        className="max-w-md p-6"
      >
              <div className="flex items-center justify-between mb-6">
                <h2 id="album-modal-title" className="text-lg font-bold text-primary-text">Create Album</h2>
                <button onClick={() => setShowCreate(false)} aria-label="Tutup form album" className="text-secondary-text hover:text-accent">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="album-title" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Album Title
                  </label>
                  <input
                    id="album-title"
                    type="text"
                    placeholder="e.g. Clash Weekly #50"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Match Date
                  </label>
                  <DatePicker
                    value={form.matchDate}
                    onChange={(v) => setForm({ ...form, matchDate: v })}
                    ariaLabel="Tanggal pertandingan album"
                  />
                </div>

                <div>
                  <label htmlFor="album-cover-upload" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Cover Photo
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
                    {form.coverUrl ? (
                      <div className="relative h-36 overflow-hidden rounded-sm">
                        <Image
                          src={form.coverUrl}
                          alt="cover"
                          fill
                          className="object-contain p-2"
                        />
                        <div className="absolute inset-0 bg-charcoal/0 hover:bg-charcoal/40 transition-colors flex items-center justify-center">
                          <span className="text-xs uppercase tracking-wider text-primary-text opacity-0 hover:opacity-100 transition-opacity">
                            Change Photo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-28 gap-2">
                        <Upload size={20} className="text-secondary-text" />
                        <span className="text-xs text-secondary-text">Click to upload cover photo</span>
                        <span className="text-[10px] text-secondary-text/50">or paste URL below</span>
                      </div>
                    )}
                    <input
                      id="album-cover-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFile}
                      className="hidden"
                    />
                  </div>
                  <input
                    type="text"
                    aria-label="URL cover photo"
                    placeholder="Or paste image URL..."
                    value={form.coverUrl}
                    onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                    className="w-full bg-elevated border border-t-0 border-border px-4 py-2.5 text-xs text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="album-gdrive" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Google Drive <span className="text-secondary-text/60 font-normal normal-case">(opsional)</span>
                  </label>
                  <div className="relative">
                    <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
                    <input
                      id="album-gdrive"
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={form.gdriveLink}
                      onChange={(e) => setForm({ ...form, gdriveLink: e.target.value })}
                      className="w-full bg-elevated border border-border pl-9 pr-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 border border-border text-secondary-text text-sm font-medium uppercase tracking-widest hover:bg-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.title || !form.matchDate}
                  className="flex-1 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Create Album
                </button>
              </div>
      </Modal>

      {managingAlbum && (
      <Modal
        open
        onClose={() => setManagingId(null)}
        labelledBy="manage-album-title"
        className="max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
      >
              <div className="flex items-center justify-between mb-6">
                <h2 id="manage-album-title" className="text-lg font-bold text-primary-text">{managingAlbum?.title}</h2>
                <button onClick={() => setManagingId(null)} aria-label="Tutup kelola album" className="text-secondary-text hover:text-accent">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <label htmlFor="manage-cover" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">Cover Image URL</label>
                <div className="flex gap-3">
                  <input
                    id="manage-cover"
                    type="text"
                    value={manageDraft.coverUrl}
                    onChange={(e) =>
                      setManageDraft((current) => ({ ...current, coverUrl: e.target.value }))
                    }
                    onBlur={() =>
                      handleUpdateField(managingAlbum, "coverUrl", manageDraft.coverUrl)
                    }
                    placeholder="https://example.com/cover.jpg"
                    className="flex-1 bg-elevated border border-border px-4 py-2.5 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                  />
                    {manageDraft.coverUrl && (
                      <div className="relative w-12 h-12 bg-elevated border border-border overflow-hidden shrink-0">
                        <Image
                          src={manageDraft.coverUrl}
                          alt="Cover preview"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    )}
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="manage-gdrive" className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                  Google Drive Link <span className="text-secondary-text/60 font-normal normal-case">(opsional)</span>
                </label>
                <input
                  id="manage-gdrive"
                  type="url"
                  value={manageDraft.gdriveLink}
                  onChange={(e) =>
                    setManageDraft((current) => ({ ...current, gdriveLink: e.target.value }))
                  }
                  onBlur={() =>
                    handleUpdateField(managingAlbum, "gdriveLink", manageDraft.gdriveLink)
                  }
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-elevated border border-border px-4 py-2.5 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                />
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
                          <Image src={item.url} alt="" fill sizes="20vw" className="object-cover" />
                        ) : item.url && item.type === "video" ? (
                          <div className="w-full h-full bg-gradient-to-br from-elevated to-border flex items-center justify-center">
                            <Video size={20} className="text-secondary-text" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-elevated to-border" />
                        )}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          aria-label="Hapus item album"
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
                    aria-label="Tipe item"
                    value={itemForm.type}
                    onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as "image" | "video" })}
                    className="bg-elevated border border-border px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <input
                    type="text"
                    aria-label="URL item album"
                    placeholder="https://example.com/photo.jpg"
                    value={itemForm.url}
                    onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                    className="flex-1 bg-elevated border border-border px-4 py-2.5 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => handleAddItem(managingAlbum.id)}
                    disabled={!itemForm.url}
                    className="px-6 py-2.5 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
      </Modal>
      )}
    </div>
  );
}
