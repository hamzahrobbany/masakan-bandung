'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/cart', label: 'Keranjang' }
];

export default function Navbar() {
  const { totalQuantity } = useCart();

  const cartBadge =
    totalQuantity > 0 ? (
      <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-semibold text-white">
        {totalQuantity}
      </span>
    ) : null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-600">
            Masakan Bandung
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium md:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center text-slate-600 transition hover:text-emerald-600"
              >
                {item.label}
                {item.href === '/cart' && cartBadge}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
