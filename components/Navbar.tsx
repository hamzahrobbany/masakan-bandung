'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useCart } from './CartProvider';

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/cart', label: 'Keranjang' }
];

export default function Navbar() {
  const { totalQuantity } = useCart();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      setIsMenuOpen(false);
    }
  };

  const cartBadge =
    totalQuantity > 0 ? (
      <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-semibold text-white">
        {totalQuantity}
      </span>
    ) : null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-600">
            Masakan Bandung
          </Link>
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/cart"
              className="flex items-center text-sm font-medium text-slate-600 transition hover:text-emerald-600"
            >
              Keranjang
              {cartBadge}
            </Link>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              className="rounded p-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="sr-only">Toggle navigation menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="3" x2="21" y1="6" y2="6" />
                <line x1="3" x2="21" y1="12" y2="12" />
                <line x1="3" x2="21" y1="18" y2="18" />
              </svg>
            </button>
          </div>
          <div
            className={`text-sm font-medium md:flex md:items-center md:gap-6 ${
              isMenuOpen ? 'mt-4 flex flex-col gap-4' : 'hidden'
            } md:mt-0`}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-600 transition hover:text-emerald-600"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
                {item.href === '/cart' && cartBadge}
              </Link>
            ))}
            <button
              type="button"
              className="rounded border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onClick={handleAdminAccess}
              disabled={isCheckingSession}
            >
              {isCheckingSession ? 'Memeriksa sesi...' : 'Login Admin'}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
