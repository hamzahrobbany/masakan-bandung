'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminFooterCTA() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  const handleAdminAccess = async () => {
    setIsCheckingSession(true);

    try {
      const response = await fetch('/api/admin/session/verify', {
        method: 'GET',
        cache: 'no-store'
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Gagal memeriksa sesi admin:', error);
      router.push('/admin/login');
    } finally {
      setIsCheckingSession(false);
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-6 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-slate-900">Akses Admin</p>
          <p className="text-slate-600">Kelola katalog, pesanan, dan konten melalui panel admin.</p>
        </div>
        <button
          type="button"
          className="rounded border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          onClick={handleAdminAccess}
          disabled={isCheckingSession}
        >
          {isCheckingSession ? 'Memeriksa sesi...' : 'Login Admin'}
        </button>
      </div>
    </footer>
  );
}
