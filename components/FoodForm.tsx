'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type CategoryOption = {
  id: string;
  name: string;
};

type FoodInitialData = {
  name: string;
  price: number;
  categoryId?: string | null;
  description?: string | null;
  imageUrl?: string | null;
};

type FoodFormProps = {
  categories: CategoryOption[];
  initialData?: FoodInitialData;
  foodId?: string;
};

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

export default function FoodForm({ categories, initialData, foodId }: FoodFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialData?.name ?? '');
  const [price, setPrice] = useState(initialData?.price?.toString() ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Gagal mengunggah gambar');
      }
      const data = await response.json();
      setImageUrl(data.url);
      setSuccess('Gambar berhasil diunggah.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat upload';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name || !price) {
      setError('Nama dan harga wajib diisi.');
      return;
    }
    if (!imageUrl) {
      setError('Silakan unggah gambar makanan terlebih dahulu.');
      return;
    }

    const payload = {
      name,
      price: Number(price),
      categoryId: categoryId || null,
      description,
      imageUrl
    };

    const url = foodId ? `/api/foods/${foodId}` : '/api/foods';
    const method = foodId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Gagal menyimpan data');
      }
      setSuccess('Data makanan berhasil disimpan.');
      startTransition(() => {
        router.push('/admin/foods');
        router.refresh();
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="text-sm font-medium text-slate-700">Nama Makanan</label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          placeholder="Misal: Seblak Ceker"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Harga ({currency.format(Number(price || 0))})</label>
        <input
          type="number"
          min="0"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          placeholder="20000"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Kategori</label>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Pilih kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Deskripsi</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          rows={3}
          placeholder="Cerita singkat tentang rasa dan topping"
        />
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">Gambar</label>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
          }}
        />
        {uploading && <p className="text-sm text-slate-500">Mengunggah gambar...</p>}
        {imageUrl && (
          <div className="relative h-40 w-full overflow-hidden rounded-xl">
            <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="100vw" unoptimized />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {foodId ? 'Simpan Perubahan' : 'Tambah Makanan'}
      </button>
    </form>
  );
}
