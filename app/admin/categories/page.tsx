// app/admin/categories/page.tsx
"use client";

import { useEffect, useState } from "react";

import AdminProtected from "@/components/AdminProtected";
import { readAdminToken } from "@/lib/admin-token";
import { ADMIN_TOKEN_HEADER } from "@/lib/security";

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
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    setError(null);
    try {
      const token = requireAdminToken();
      const res = await fetch("/api/admin/categories", {
        headers: {
          [ADMIN_TOKEN_HEADER]: token,
        },
      });
      if (!res.ok) {
        throw new Error("Gagal memuat kategori");
      }
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat kategori";
      setError(message);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function requireAdminToken() {
    const token = readAdminToken();
    if (!token) {
      throw new Error("Token admin tidak ditemukan. Muat ulang halaman admin.");
    }
    return token;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const token = requireAdminToken();
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_TOKEN_HEADER]: token,
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        throw new Error("Gagal membuat kategori");
      }
      setName("");
      await loadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat kategori";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) return;

    try {
      const token = requireAdminToken();
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_TOKEN_HEADER]: token,
        },
        body: JSON.stringify({ name: editingName }),
      });

      if (!res.ok) {
        throw new Error("Gagal update kategori");
      }
      setEditingId(null);
      setEditingName("");
      await loadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal update kategori";
      alert(message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus kategori?")) return;

    try {
      const token = requireAdminToken();
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: {
          [ADMIN_TOKEN_HEADER]: token,
        },
      });
      if (!res.ok) {
        throw new Error("Gagal hapus kategori");
      }
      await loadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal hapus kategori";
      alert(message);
    }
  }

  return (
    <AdminProtected>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold">Kategori</h1>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
    </AdminProtected>
  );
}
