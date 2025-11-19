import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/cart', label: 'Keranjang' },
  { href: '/admin/foods', label: 'Admin' }
];

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-600">
          Masakan Bandung
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-slate-600 transition hover:text-emerald-600">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
