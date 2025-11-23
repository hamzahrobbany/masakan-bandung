"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { readAdminToken } from "@/lib/admin-token";
import { ADMIN_TOKEN_HEADER } from "@/lib/security";

export type CategoryOption = { id: string; name: string };

export type FoodFormData = {
  id?: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl: string;
  categoryId: string;
  stock: number;
  rating: number;
  isAvailable: boolean;
  isFeatured: boolean;
};

type FoodFormProps = {
  categories: CategoryOption[];
  initialData?: FoodFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type FormState = {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  stock: string;
  rating: string;
  isAvailable: boolean;
  isFeatured: boolean;
};

const emptyForm: FormState = {
  name: "",
  price: "",
  description: "",
  imageUrl: "",
  categoryId: "",
  stock: "0",
  rating: "5",
  isAvailable: true,
  isFeatured: false,
};

export default function FoodForm({
  categories,
  initialData,
  onSuccess,
  onCancel,
}: FoodFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        price: initialData.price?.toString() ?? "",
        description: initialData.description ?? "",
        imageUrl: initialData.imageUrl ?? "",
        categoryId: initialData.categoryId ?? "",
        stock: initialData.stock?.toString() ?? "0",
        rating: initialData.rating?.toString() ?? "5",
        isAvailable: initialData.isAvailable,
        isFeatured: initialData.isFeatured,
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const adminToken = readAdminToken();
      if (!adminToken) {
        throw new Error("Token admin tidak ditemukan. Muat ulang halaman admin.");
      }

      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          [ADMIN_TOKEN_HEADER]: adminToken,
        },
        body: formData,
      });
      if (!res.ok) {
        const message = await res
          .json()
          .then((data) => data?.error ?? "Gagal mengunggah gambar")
          .catch(() => "Gagal mengunggah gambar");
        throw new Error(message);
      }
      const data = await res.json();
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
      setSuccess("Gambar berhasil diunggah");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat upload";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim()) {
      setError("Nama makanan wajib diisi");
      return;
    }
    if (!form.categoryId) {
      setError("Kategori wajib dipilih");
      return;
    }

    const priceValue = Number(form.price);
    const stockValue = Number(form.stock ?? 0);
    const ratingValue = Number(form.rating ?? 0);

    if (Number.isNaN(priceValue) || priceValue < 0) {
      setError("Harga harus berupa angka minimal 0");
      return;
    }
    if (Number.isNaN(stockValue) || stockValue < 0) {
      setError("Stok tidak boleh negatif");
      return;
    }
    if (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
      setError("Rating harus di antara 0 hingga 5");
      return;
    }

    if (!form.imageUrl) {
      setError("Silakan unggah gambar terlebih dahulu");
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: priceValue,
      description: form.description.trim() ? form.description.trim() : null,
      imageUrl: form.imageUrl,
      categoryId: form.categoryId,
      stock: stockValue,
      rating: ratingValue,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
    };

    setSubmitting(true);
    try {
      const adminToken = readAdminToken();
      if (!adminToken) {
        throw new Error("Token admin tidak ditemukan. Muat ulang halaman admin.");
      }

      const url = initialData?.id
        ? `/api/admin/foods/${initialData.id}`
        : "/api/admin/foods";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          [ADMIN_TOKEN_HEADER]: adminToken,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const message = await res
          .json()
          .then((data) => data?.error ?? "Gagal menyimpan makanan")
          .catch(() => "Gagal menyimpan makanan");
        throw new Error(message);
      }

      setSuccess("Makanan berhasil disimpan");
      if (!initialData) {
        setForm(emptyForm);
      }
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nama Makanan</label>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            placeholder="Seblak Ceker"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Harga</label>
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            placeholder="20000"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Kategori</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Pilih kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Stok</label>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            placeholder="10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Rating (0-5)</label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={form.rating}
            onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            placeholder="4.5"
          />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Tersedia
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Deskripsi</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          rows={3}
          placeholder="Cerita singkat tentang rasa dan topping"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Gambar</label>
          <span className="text-xs text-slate-500">Unggah via /api/upload</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleUpload(file);
              }
            }}
            className="text-sm"
          />
          {uploading && <span className="text-xs text-slate-500">Mengunggah...</span>}
        </div>
        <input
          type="url"
          value={form.imageUrl}
          onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
          placeholder="https://..."
          className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
        />
        {form.imageUrl && (
          <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200">
            <Image
              src={form.imageUrl}
              alt="Preview"
              fill
              className="object-cover"
              sizes="100vw"
              unoptimized
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Tambah Makanan"}
        </button>
      </div>
    </form>
  );
}
