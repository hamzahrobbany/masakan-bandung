'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <span aria-hidden>!</span>
      </div>
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-600">Terjadi kesalahan</p>
        <h1 className="text-2xl font-semibold text-slate-900">Maaf, halaman tidak dapat dimuat</h1>
        <p className="text-sm text-slate-600">
          {error.message || 'Silakan coba ulang atau muat ulang halaman ini.'}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Coba lagi
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Muat ulang halaman
        </button>
      </div>
    </div>
  );
}
