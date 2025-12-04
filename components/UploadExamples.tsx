'use client';

import { useCallback, useState } from 'react';
import { useFormState } from 'react-dom';

import { uploadFoodImageAction } from '@/app/(admin)/admin/foods/actions';
import { ensureAdminToken } from '@/lib/admin-token';
import { ADMIN_TOKEN_HEADER } from '@/lib/security';

type UploadFormState = {
  url?: string;
  error?: string;
};

const initialState: UploadFormState = {};

export function UploadViaServerAction() {
  const [state, formAction] = useFormState(async (_prev: UploadFormState, formData: FormData) => {
    try {
      const url = await uploadFoodImageAction(formData);
      return { url, error: undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Upload gagal',
        url: undefined
      };
    }
  }, initialState);

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-600">Server Action Upload</p>
      <input type="file" name="file" accept="image/*" required />
      <button type="submit" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
        Upload via Server Action
      </button>
      {state.url && <p className="text-sm text-emerald-600">URL: {state.url}</p>}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function UploadViaClientComponent() {
  const [status, setStatus] = useState<'idle' | 'uploading'>('idle');
  const [message, setMessage] = useState<UploadFormState>({});

  const handleUpload = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      setMessage({ error: 'Pilih file terlebih dahulu.' });
      return;
    }

    setStatus('uploading');
    setMessage({});
    try {
      const token = await ensureAdminToken();
      const requestForm = new FormData();
      requestForm.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          [ADMIN_TOKEN_HEADER]: token
        },
        body: requestForm
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Upload gagal');
      }

      const result = (await response.json()) as { url: string };
      setMessage({ url: result.url });
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : 'Upload gagal' });
    } finally {
      setStatus('idle');
    }
  }, []);

  return (
    <form onSubmit={handleUpload} className="space-y-2 rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-600">Client Component Upload</p>
      <input type="file" name="file" accept="image/*" required />
      <button
        type="submit"
        disabled={status === 'uploading'}
        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload via Client'}
      </button>
      {message.url && <p className="text-sm text-emerald-600">URL: {message.url}</p>}
      {message.error && <p className="text-sm text-red-600">{message.error}</p>}
    </form>
  );
}
