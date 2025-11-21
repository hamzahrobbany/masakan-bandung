// app/admin/foods/page.tsx
"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string };
type Food = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl: string;
  categoryId: string;
  category?: Category;
  isAvailable: boolean;
};

export default function AdminFoodsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
    categoryId: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadCategories() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data);
  }

  async function loadFoods() {
    const res = await fetch("/api/admin/foods");
    const data = await res.json();
    setFoods(data);
  }

  useEffect(() => {
    loadCategories();
    loadFoods();
  }, []);

  function resetForm() {
    setForm({
      name: "",
      price: "",
      description: "",
      imageUrl: "",
      categoryId: "",
    });
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) return;

    setLoading(true);

    const payload = {
      name: form.name,
      price: Number(form.price),
      description: form.description || undefined,
      imageUrl: form.imageUrl || "https://picsum.photos/400",
      categoryId: form.categoryId,
    };

    const url = editingId
      ? `/api/admin/foods/${editingId}`
      : "/api/admin/foods";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Gagal menyimpan data makanan");
      return;
    }

    resetForm();
    await loadFoods();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus makanan ini?")) return;

    const res = await fetch(`/api/admin/foods/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Gagal hapus makanan");
      return;
    }

    await loadFoods();
  }

  async function toggleAvailability(food: Food) {
    const res = await fetch(`/api/admin/foods/${food.id}`, {
      method: "PUT",
      body: JSON.stringify({
        isAvailable: !food.isAvailable,
      }),
    });

    if (!res.ok) {
      alert("Gagal update status");
      return;
    }

    await loadFoods();
  }

  function startEdit(food: Food) {
    setEditingId(food.id);
    setForm({
      name: food.name,
      price: String(food.price),
      description: food.description || "",
      imageUrl: food.imageUrl,
      categoryId: food.categoryId,
    });
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Menu Makanan</h1>

      {/* Form Create / Edit */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Nama</label>
          <input
            className="border px-3 py-2 rounded w-full"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500">Harga</label>
          <input
            type="number"
            className="border px-3 py-2 rounded w-full"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs text-slate-500">Deskripsi</label>
          <textarea
            className="border px-3 py-2 rounded w-full"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500">URL Gambar</label>
          <input
            className="border px-3 py-2 rounded w-full"
            value={form.imageUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, imageUrl: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500">Kategori</label>
          <select
            className="border px-3 py-2 rounded w-full"
            value={form.categoryId}
            onChange={(e) =>
              setForm((f) => ({ ...f, categoryId: e.target.value }))
            }
          >
            <option value="">Pilih kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex gap-2 justify-end">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded bg-slate-200 text-sm"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-slate-900 text-white text-sm disabled:opacity-50"
          >
            {loading
              ? "Menyimpan..."
              : editingId
              ? "Simpan Perubahan"
              : "Tambah Makanan"}
          </button>
        </div>
      </form>

      {/* Tabel */}
      <div className="bg-white rounded shadow p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Nama</th>
              <th className="text-left py-2">Kategori</th>
              <th className="text-right py-2">Harga</th>
              <th className="text-center py-2">Status</th>
              <th className="text-left py-2 w-40">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {foods.map((food) => (
              <tr key={food.id} className="border-b last:border-0">
                <td className="py-2">{food.name}</td>
                <td className="py-2">
                  {food.category?.name ??
                    categories.find((c) => c.id === food.categoryId)?.name ??
                    "-"}
                </td>
                <td className="py-2 text-right">
                  Rp {food.price.toLocaleString("id-ID")}
                </td>
                <td className="py-2 text-center">
                  <button
                    onClick={() => toggleAvailability(food)}
                    className={`px-2 py-1 rounded text-xs ${
                      food.isAvailable
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {food.isAvailable ? "Tersedia" : "Habis"}
                  </button>
                </td>
                <td className="py-2 space-x-2">
                  <button
                    className="text-xs bg-slate-900 text-white px-2 py-1 rounded"
                    onClick={() => startEdit(food)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                    onClick={() => handleDelete(food.id)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {foods.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
                  Belum ada makanan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
