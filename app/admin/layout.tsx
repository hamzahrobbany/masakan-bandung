// app/admin/layout.tsx
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="px-4 py-4 text-lg font-bold border-b border-slate-700">
          Admin Masakan Bandung
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 text-sm">
          <Link href="/admin" className="block hover:text-amber-300">
            Dashboard
          </Link>
          <Link href="/admin/categories" className="block hover:text-amber-300">
            Kategori
          </Link>
          <Link href="/admin/foods" className="block hover:text-amber-300">
            Menu Makanan
          </Link>
          <Link href="/admin/orders" className="block hover:text-amber-300">
            Pesanan
          </Link>
        </nav>
        <form
          action="/api/admin/logout"
          method="post"
          className="px-4 py-4 border-t border-slate-700"
        >
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-sm font-medium py-2 rounded"
          >
            Logout
          </button>
        </form>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-slate-50">{children}</main>
    </div>
  );
}
