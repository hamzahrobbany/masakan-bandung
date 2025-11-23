"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

type MenuItem = {
  key: string;
  label: string;
};

const items: MenuItem[] = [
  { key: "/admin", label: "Dashboard" },
  { key: "/admin/foods", label: "Makanan" },
  { key: "/admin/categories", label: "Kategori" },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }, [router]);

  return (
    <aside className="flex w-64 flex-col bg-slate-900 text-white">
      <div className="px-5 py-6 text-xl font-semibold tracking-wide">
        Admin Panel
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {items.map((item) => {
          const active = pathname === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavigate(item.key)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                active ? "bg-emerald-500 text-white" : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-2 pb-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
