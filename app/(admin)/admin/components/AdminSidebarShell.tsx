"use client";

import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("./AdminSidebar"), {
  ssr: false,
  loading: () => (
    <div className="w-64 bg-slate-900/80 text-white p-6">Memuat menu...</div>
  ),
});

export default function AdminSidebarShell() {
  return <Sidebar />;
}
