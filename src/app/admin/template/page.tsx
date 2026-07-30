"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, Search, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Template = {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  image: string;
  themeKey: string;
};

type Toast = { type: "success" | "error"; message: string } | null;
type ConfirmState = { open: boolean; message: string; onConfirm: () => void };

export default function AdminTemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newThemeKey, setNewThemeKey] = useState("classic");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState("");

  // Edit modal
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editThemeKey, setEditThemeKey] = useState("classic");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [newDragActive, setNewDragActive] = useState(false);
  const [editDragActive, setEditDragActive] = useState(false);

  // Feedback
  const [toast, setToast] = useState<Toast>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, message: "", onConfirm: () => {} });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const openConfirm = (message: string, onConfirm: () => void) => {
    setConfirm({ open: true, message, onConfirm });
  };

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok) setTemplates(await res.json());
      } catch {
        showToast("error", "Gagal memuat data template");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    try {
      const imageUrl = newImageFile ? await uploadImage(newImageFile) : undefined;
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          category: newCategory || "Classic",
          price: parseInt(newPrice),
          themeKey: newThemeKey,
          image: imageUrl,
        }),
      });
      if (res.ok) {
        const template = await res.json();
        setTemplates([...templates, template]);
        setNewName("");
        setNewCategory("");
        setNewPrice("");
        setNewThemeKey("classic");
        setNewImageFile(null);
        setNewImagePreview("");
        setShowAdd(false);
        showToast("success", "Template berhasil ditambahkan");
      } else {
        showToast("error", "Gagal menambah template");
      }
    } catch {
      showToast("error", "Gagal menambah template");
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Gagal upload gambar");
    }

    const data = await res.json();
    return data.url as string;
  };

  const openEdit = (tpl: Template) => {
    setEditTemplate(tpl);
    setEditName(tpl.name);
    setEditCategory(tpl.category);
    setEditPrice(String(tpl.price));
    setEditThemeKey(tpl.themeKey || "classic");
    setEditImageFile(null);
    setEditImagePreview(tpl.image);
  };

  const validateImageFile = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      showToast("error", "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "File terlalu besar. Maksimal 10MB.");
      return false;
    }

    return true;
  };

  const handleNewImageChange = (file: File | null) => {
    if (!file) {
      setNewImageFile(null);
      setNewImagePreview("");
      return;
    }

    if (!validateImageFile(file)) {
      setNewImageFile(null);
      setNewImagePreview("");
      return;
    }

    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleEditImageChange = (file: File | null) => {
    if (!file) {
      setEditImageFile(null);
      setEditImagePreview(editTemplate?.image || "");
      return;
    }

    if (!validateImageFile(file)) {
      setEditImageFile(null);
      return;
    }

    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, setDragActive: React.Dispatch<React.SetStateAction<boolean>>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>, setDragActive: React.Dispatch<React.SetStateAction<boolean>>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    setDragActive: React.Dispatch<React.SetStateAction<boolean>>,
    changeHandler: (file: File | null) => void
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    if (file) {
      changeHandler(file);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTemplate) return;
    try {
      const imageUrl = editImageFile ? await uploadImage(editImageFile) : undefined;
      const body: Record<string, unknown> = {
        name: editName,
        category: editCategory,
        price: parseInt(editPrice),
        themeKey: editThemeKey,
      };
      if (imageUrl) body.image = imageUrl;
      const res = await fetch(`/api/templates/${editTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));
        setEditTemplate(null);
        setEditImageFile(null);
        setEditImagePreview("");
        showToast("success", "Template berhasil diperbarui");
      } else {
        showToast("error", "Gagal memperbarui template");
      }
    } catch {
      showToast("error", "Gagal memperbarui template");
    }
  };

  const handleDelete = (id: string) => {
    openConfirm("Apakah Anda yakin ingin menghapus template ini?", async () => {
      setConfirm((c) => ({ ...c, open: false }));
      try {
        const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
        if (res.ok) {
          setTemplates(templates.filter((t) => t.id !== id));
          showToast("success", "Template berhasil dihapus");
        } else {
          showToast("error", "Gagal menghapus template");
        }
      } catch {
        showToast("error", "Gagal menghapus template");
      }
    });
  };

  const toggleStatus = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    const next = template.status === "active" ? "inactive" : "active";
    openConfirm(
      `${next === "inactive" ? "Nonaktifkan" : "Aktifkan"} template ini?`,
      async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          const res = await fetch(`/api/templates/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: next }),
          });
          if (res.ok) {
            setTemplates(templates.map((t) => (t.id === id ? { ...t, status: next } : t)));
            showToast("success", "Status template diperbarui");
          } else {
            showToast("error", "Gagal mengubah status template");
          }
        } catch {
          showToast("error", "Gagal mengubah status template");
        }
      }
    );
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Confirm Modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <p className="text-sm font-medium">{confirm.message}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirm((c) => ({ ...c, open: false }))} className="btn-secondary text-sm">Batal</button>
              <button onClick={confirm.onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6 no-scrollbar">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Edit Template</h2>
              <button onClick={() => setEditTemplate(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleEdit} className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nama Template</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-custom" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Kategori</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="input-custom">
                  <option>Classic</option><option>Modern</option><option>Luxury</option><option>Bohemian</option><option>Elegant</option><option>Vintage</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Harga (IDR)</label>
                <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="input-custom" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tema</label>
                <select value={editThemeKey} onChange={(e) => setEditThemeKey(e.target.value)} className="input-custom">
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Upload Gambar Baru</label>
                <div
                  className={`relative group mt-2 flex min-h-[170px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-slate-50 px-4 py-6 text-center transition ${editDragActive ? "border-blue-500 bg-blue-50" : "border-border hover:border-primary"}`}
                  onDragOver={(e) => handleDragOver(e, setEditDragActive)}
                  onDragLeave={(e) => handleDragLeave(e, setEditDragActive)}
                  onDrop={(e) => handleDrop(e, setEditDragActive, handleEditImageChange)}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleEditImageChange(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="pointer-events-none">
                    <p className="text-sm font-medium text-muted-foreground">Tarik dan lepas file di sini, atau klik untuk pilih.</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF hingga 10MB</p>
                  </div>
                </div>
                {editImagePreview ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground mb-2">Preview gambar</p>
                    <img src={editImagePreview} alt="Preview template" className="h-48 w-full rounded-lg object-cover" />
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-border bg-slate-50 p-3 text-sm text-muted-foreground">
                    Belum ada gambar dipilih.
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditTemplate(null)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary"><Upload className="h-4 w-4" /> Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Template & Price List</h1>
          <p className="mt-1 text-muted-foreground">Kelola template undangan dan harga paket.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary"><Plus className="h-4 w-4" /> Tambah Template</button>
      </div>

      {showAdd && (
        <div className="mb-6 card-custom">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Tambah Template Baru</h2>
            <button onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Template</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="input-custom" placeholder="Nama template" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kategori</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-custom">
                <option value="">Pilih kategori</option>
                <option>Classic</option><option>Modern</option><option>Luxury</option><option>Bohemian</option><option>Elegant</option><option>Vintage</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Harga (IDR)</label>
              <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="input-custom" placeholder="150000" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tema</label>
              <select value={newThemeKey} onChange={(e) => setNewThemeKey(e.target.value)} className="input-custom">
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Upload Gambar Template</label>
              <div
                className={`relative group mt-2 flex min-h-[170px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-slate-50 px-4 py-6 text-center transition ${newDragActive ? "border-blue-500 bg-blue-50" : "border-border hover:border-primary"}`}
                onDragOver={(e) => handleDragOver(e, setNewDragActive)}
                onDragLeave={(e) => handleDragLeave(e, setNewDragActive)}
                onDrop={(e) => handleDrop(e, setNewDragActive, handleNewImageChange)}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleNewImageChange(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="pointer-events-none">
                  <p className="text-sm font-medium text-muted-foreground">Tarik dan lepas file di sini, atau klik untuk pilih.</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF hingga 10MB</p>
                </div>
              </div>
              {newImagePreview ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-border bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground mb-2">Preview gambar</p>
                  <img src={newImagePreview} alt="Preview template" className="h-48 w-full rounded-lg object-cover" />
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-border bg-slate-50 p-3 text-sm text-muted-foreground">
                  Belum ada gambar dipilih.
                </div>
              )}
            </div>
            <div className="flex items-end sm:col-span-4">
              <button type="submit" className="btn-primary"><Upload className="h-4 w-4" /> Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari template..." className="input-custom pl-10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tpl) => (
          <div key={tpl.id} className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image src={tpl.image} alt={tpl.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
              <div className="absolute top-2 left-2">
                <span className="badge-muted bg-white/90">{tpl.category}</span>
              </div>
              <div className="absolute top-2 right-2">
                <button onClick={() => toggleStatus(tpl.id)} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tpl.status === "active" ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
                  {tpl.status === "active" ? "Aktif" : "Nonaktif"}
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{tpl.name}</h3>
                <span className="font-bold text-primary">{formatCurrency(tpl.price)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground capitalize">Tema: {tpl.themeKey}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(tpl)} className="btn-secondary flex-1 text-xs"><Edit className="h-3 w-3" /> Edit</button>
                <button onClick={() => handleDelete(tpl.id)} className="rounded-lg bg-red-100 px-3 py-2 text-red-600 hover:bg-red-200"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
