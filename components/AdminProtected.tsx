'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { clearAdminToken, saveAdminToken } from '@/lib/admin-token';

type AdminProtectedProps = {
  children: ReactNode;
};

export default function AdminProtected({ children }: AdminProtectedProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authenticated'>('loading');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    fetch('/api/admin/session', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unauthorized');
        }
        const data = await response.json();
        if (data?.csrfToken) {
          saveAdminToken(data.csrfToken);
        }
        return data;
      })
      .then(() => {
        if (isMounted) {
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (isMounted) {
          clearAdminToken();
          router.replace('/admin/login');
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Memeriksa sesi admin...
      </div>
    );
  }

  return <>{children}</>;
}
