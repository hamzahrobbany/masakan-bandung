// app/admin/foods/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import FoodForm, {
  CategoryOption,
  FoodFormData,
} from "@/app/admin/foods/components/FoodForm";
import AdminProtected from "@/components/AdminProtected";
import { readAdminToken } from "@/lib/admin-token";
import { ADMIN_TOKEN_HEADER } from "@/lib/security";
import { formatCurrency } from "@/lib/utils";

type Food = FoodFormData & { id: string; category?: CategoryOption | null };

export default function AdminFoodsPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requireAdminToken = useCallback(() => {
    const token = readAdminToken();
    if (!token) {
      throw new Error("Token admin tidak ditemukan. Muat ulang halaman admin.");
    }
    return token;
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const token = requireAdminToken();
      const res = await fetch("/api/admin/categories", {
        headers: {
          [ADMIN_TOKEN_HEADER]: token,
        },
      });
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat kategori";
      setError(message);
    }
  }, [requireAdminToken]);

  const loadFoods = useCallback(async () => {
    try {
      const token = requireAdminToken();
      const res = await fetch("/api/admin/foods", {
        headers: {
          [ADMIN_TOKEN_HEADER]: token,
        },
      });
      if (!res.ok) throw new Error("Gagal memuat makanan");
      const data = await res.json();
      setFoods(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat makanan";
      setError(message);
    }
  }, [requireAdminToken]);

  useEffect(() => {
    void Promise.all([loadCategories(), loadFoods()]);
  }, [loadCategories, loadFoods]);

  const filteredFoods = useMemo(() => {
    if (!filterCategory) return foods;
    return foods.filter((food) => food.categoryId === filterCategory);
  }, [filterCategory, foods]);

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus makanan ini?")) return;
    setLoading(true);
    try {
      const token = requireAdminToken();
      const res = await fetch(`/api/admin/foods/${id}`, {
        method: "DELETE",
        headers: {
          [ADMIN_TOKEN_HEADER]: token,
        },
      });
      if (!res.ok) {
        throw new Error("Gagal hapus makanan");
      }
      setEditingFood(null);
      await loadFoods();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal hapus makanan";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability(food: Food) {
    setLoading(true);
    try {
      const token = requireAdminToken();
      const res = await fetch(`/api/admin/foods/${food.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_TOKEN_HEADER]: token,
        },
        body: JSON.stringify({
          isAvailable: !food.isAvailable,
        }),
      });
      if (!res.ok) {
        throw new Error("Gagal update status");
      }
      await loadFoods();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal update status";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingFood(null);
    setIsModalOpen(true);
  }

  function openEditModal(food: Food) {
    setEditingFood(food);
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingFood(null);
    setIsModalOpen(false);
  }

  return (
    <AdminProtected>
      <div className="space-y-8 p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
            <h1 className="text-3xl font-bold text-slate-900">Kelola Makanan</h1>
            <p className="text-sm text-slate-600">Tambah, ubah, dan atur ketersediaan menu.</p>
          </div>
          <div className="space-y-1 text-right text-sm text-slate-500">
            <p>Total makanan: {foods.length}</p>
            <p>Filter kategori untuk fokus pada menu tertentu.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={openCreateModal}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            Tambah Makanan
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Daftar Makanan</h2>
              <p className="text-sm text-slate-500">Gunakan tombol tambah atau edit untuk membuka formulir.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600">Filter kategori</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Semua</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2">Rating</th>
                  <th className="px-3 py-2">Stok</th>
                  <th className="px-3 py-2 text-right">Harga</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.map((food) => (
                  <tr key={food.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{food.name}</span>
                          {food.isFeatured && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{food.description}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {food.category?.name ??
                        categories.find((c) => c.id === food.categoryId)?.name ??
                        "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">⭐ {food.rating.toFixed(1)}</td>
                    <td className="px-3 py-2 text-slate-700">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          food.stock === 0
                            ? "bg-red-100 text-red-700"
                            : food.stock < 5
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        Stok {food.stock}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatCurrency(food.price)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => toggleAvailability(food)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          food.isAvailable
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                        disabled={loading}
                      >
                        {food.isAvailable ? "Tersedia" : "Tidak tersedia"}
                      </button>
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                        onClick={() => openEditModal(food)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        onClick={() => void handleDelete(food.id)}
                        disabled={loading}
                      >
                        Hapus
                      </button>
                      {!food.isAvailable && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                          Tidak tersedia
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredFoods.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                      Tidak ada makanan untuk kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-emerald-600">{editingFood ? "Edit" : "Tambah"} Makanan</p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingFood ? editingFood.name : "Form Makanan"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
            <FoodForm
              categories={categories}
              initialData={editingFood ?? undefined}
              onSuccess={async () => {
                await loadFoods();
                closeModal();
              }}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </AdminProtected>
  );
}
