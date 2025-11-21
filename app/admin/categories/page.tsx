// app/admin/categories/page.tsx
"use client";

import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCategories() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!res.ok) {
      alert("Gagal membuat kategori");
      return;
    }
    setName("");
    await loadCategories();
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) return;

    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editingName }),
    });

    if (!res.ok) {
      alert("Gagal update kategori");
      return;
    }
    setEditingId(null);
    setEditingName("");
    await loadCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus kategori?")) return;

    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("Gagal hapus kategori");
      return;
    }
    await loadCategories();
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Kategori</h1>

      {/* Form tambah */}
      <form
        onSubmit={handleCreate}
        className="bg-white rounded shadow p-4 flex gap-2 items-center"
      >
        <input
          type="text"
          placeholder="Nama kategori baru"
          className="border px-3 py-2 rounded flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-900 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Tambah"}
        </button>
      </form>

      {/* Tabel kategori */}
      <div className="bg-white rounded shadow p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Nama</th>
              <th className="text-left py-2 w-40">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b last:border-0">
                <td className="py-2">
                  {editingId === cat.id ? (
                    <input
                      className="border px-2 py-1 rounded w-full"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                    />
                  ) : (
                    cat.name
                  )}
                </td>
                <td className="py-2 space-x-2">
                  {editingId === cat.id ? (
                    <>
                      <button
                        className="text-xs bg-emerald-600 text-white px-2 py-1 rounded"
                        onClick={() => handleUpdate(cat.id)}
                      >
                        Simpan
                      </button>
                      <button
                        className="text-xs bg-slate-300 px-2 py-1 rounded"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="text-xs bg-slate-900 text-white px-2 py-1 rounded"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handleDelete(cat.id)}
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} className="py-4 text-center text-slate-500">
                  Belum ada kategori
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
