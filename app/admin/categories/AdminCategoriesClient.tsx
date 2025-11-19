'use client';

import { useState } from 'react';
import type { Category } from '@prisma/client';

import AdminProtected from '@/components/AdminProtected';
import { readAdminToken } from '@/lib/admin-token';
import { ADMIN_TOKEN_HEADER } from '@/lib/security';

type AdminCategoriesClientProps = {
  categories: Category[];
};

type FormState = {
  name: string;
  id?: string;
};

export default function AdminCategoriesClient({ categories }: AdminCategoriesClientProps) {
  const [items, setItems] = useState<Category[]>(categories);
  const [form, setForm] = useState<FormState>({ name: '' });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const adminToken = readAdminToken();

  const resetForm = () => setForm({ name: '' });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/categories/${form.id}` : '/api/categories';
    setLoadingId(form.id ?? 'new');

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { [ADMIN_TOKEN_HEADER]: adminToken } : {})
      },
      body: JSON.stringify({ name: form.name })
    });

    const data = await response.json().catch(() => ({}));
    setLoadingId(null);

    if (!response.ok) {
      setMessage(data?.error ?? 'Gagal menyimpan kategori');
      return;
    }

    if (form.id) {
      setItems((prev) => prev.map((item) => (item.id === form.id ? data : item)));
    } else {
      setItems((prev) => [...prev, data]);
    }

    resetForm();
    setMessage(form.id ? 'Kategori diperbarui' : 'Kategori dibuat');
  }

  async function handleEdit(category: Category) {
    setForm({ id: category.id, name: category.name });
  }

  async function handleDelete(category: Category) {
    setMessage('');
    setLoadingId(category.id);

    const response = await fetch(`/api/categories/${category.id}`, {
      method: 'DELETE',
      headers: adminToken ? { [ADMIN_TOKEN_HEADER]: adminToken } : undefined
    });

    const data = await response.json().catch(() => ({}));
    setLoadingId(null);

    if (!response.ok) {
      setMessage(data?.error ?? 'Gagal menghapus kategori');
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== category.id));
    if (form.id === category.id) resetForm();
    setMessage('Kategori dihapus');
  }

  return (
    <AdminProtected>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
            <h1 className="text-3xl font-bold text-slate-900">Manajemen Kategori</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="w-full text-sm font-semibold text-slate-700 sm:w-40">Nama Kategori</label>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Masakan Nusantara"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!form.name.trim() || Boolean(loadingId)}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loadingId ? 'Menyimpan...' : form.id ? 'Perbarui' : 'Tambah'}
            </button>
            {form.id && (
              <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500">
                Batal edit
              </button>
            )}
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Nama</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{category.name}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(category)}
                      className="text-emerald-600"
                      disabled={loadingId === category.id}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      className="text-slate-500 hover:text-slate-900"
                      disabled={loadingId === category.id}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                    Belum ada kategori terdaftar.
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
