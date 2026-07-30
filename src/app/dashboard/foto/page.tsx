"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, Trash2, ImagePlus, FolderOpen } from "lucide-react";
import { useToast } from "@/components/Toast";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  category: string | null;
  order: number;
  createdAt: string;
};

export default function FotoPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ url: "", caption: "", category: "prewedding", order: 0 });
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const res = await fetch("/api/photos");
        if (res.ok) {
          const data = await res.json();
          setPhotos(data);
        }
      } catch (error) {
        console.error("Failed to fetch photos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPhotos();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPhoto),
      });
      if (res.ok) {
        const photo = await res.json();
        setPhotos([...photos, photo]);
        setNewPhoto({ url: "", caption: "", category: "prewedding", order: 0 });
        setShowAddForm(false);
        showToast("success", "Foto berhasil ditambahkan");
      } else {
        showToast("error", "Gagal menambah foto");
      }
    } catch (error) {
      console.error("Add photo error:", error);
      showToast("error", "Gagal menambah foto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus foto ini?")) return;
    try {
      const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos(photos.filter((p) => p.id !== id));
        showToast("success", "Foto berhasil dihapus");
      } else {
        showToast("error", "Gagal menghapus foto");
      }
    } catch (error) {
      console.error("Delete photo error:", error);
      showToast("error", "Gagal menghapus foto");
    }
  };

  const categories = ["prewedding", "wedding", "reception"];

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Galeri Foto</h1>
          <p className="mt-1 text-muted-foreground">Kelola foto prewedding dan wedding.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
          <ImagePlus className="h-4 w-4" /> Tambah Foto
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 card-custom">
          <h2 className="mb-4 font-semibold">Tambah Foto Baru</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">URL Foto *</label>
              <input
                type="url"
                required
                value={newPhoto.url}
                onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                className="input-custom"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kategori</label>
              <select
                value={newPhoto.category}
                onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })}
                className="input-custom"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "prewedding" ? "Prewedding" : cat === "wedding" ? "Wedding" : "Reception"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Caption</label>
              <input
                type="text"
                value={newPhoto.caption}
                onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                className="input-custom"
                placeholder="Keterangan foto"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                <Upload className="h-4 w-4" /> Simpan
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="card-custom text-center text-muted-foreground py-12">
          <FolderOpen className="mx-auto h-12 w-12 mb-4" />
          <p>Belum ada foto. Tambahkan foto pertama Anda!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <div className="aspect-square overflow-hidden">
                <Image src={photo.url} alt={photo.caption || "Photo"} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition group-hover:scale-105" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium line-clamp-2">{photo.caption || "Tanpa caption"}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="badge-muted text-xs">{photo.category}</span>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                    title="Hapus foto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}