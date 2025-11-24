import type { Metadata } from "next";
import "./globals.css";
import "@ant-design/v5-patch-for-react-19";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Masakan Bandung",
  description: "Katalog makanan khas Bandung dengan fitur pemesanan cepat dan panel admin."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AntdRegistry>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">
            {children}
          </main>
        </AntdRegistry>
      </body>
    </html>
  );
}
