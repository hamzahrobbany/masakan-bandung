// app/admin/layout.tsx
import type { ReactNode } from "react";

import AdminSidebarShell from "./components/AdminSidebarShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebarShell />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
