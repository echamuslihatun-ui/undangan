"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ImageIcon, Filter } from "lucide-react";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  category: string | null;
  order: number;
};

function GalleryContent() {
  const searchParams = useSearchParams();
  const weddingId = searchParams.get("weddingId");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchPhotos() {
      try {
        if (!weddingId) return;
        const res = await fetch(`/api/public/weddings/${weddingId}`);
        if (res.ok) {
          const data = await res.json();
          setPhotos(data.photoAlbum || []);
        }
      } catch (error) {
        console.error("Failed to fetch photos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPhotos();
  }, [weddingId]);

  const filtered = filter === "all" ? photos : photos.filter((p) => p.category === filter);
  const categories = ["all", "prewedding", "wedding", "reception"];

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold">Galeri Foto</h1>
          <p className="mt-2 text-muted-foreground">
            Koleksi foto prewedding dan wedding kami
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat === "all" ? "Semua" : cat === "prewedding" ? "Prewedding" : cat === "wedding" ? "Wedding" : "Reception"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>Belum ada foto di kategori ini.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="aspect-square overflow-hidden">
                  <Image src={photo.url} alt={photo.caption || "Photo"} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition group-hover:scale-105" />
                </div>
                {photo.caption && (
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-2">{photo.caption}</p>
                    {photo.category && (
                      <span className="badge-muted text-xs mt-2 inline-block">
                        {photo.category}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <GalleryContent />
    </Suspense>
  );
}
