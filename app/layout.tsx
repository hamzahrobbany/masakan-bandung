import type { Metadata } from "next";
import "./globals.css";
import "@ant-design/v5-patch-for-react-19";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/components/CartProvider";
import AdminFooterCTA from "@/components/AdminFooterCTA";

const siteTitle = "Masakan Bandung | Kuliner Khas Bandung";
const siteDescription =
  "Katalog makanan khas Bandung dengan pemesanan cepat, kurasi resep autentik, dan panel admin modern.";
const heroImageUrl = "/placeholder.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://masakan-bandung.vercel.app"),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "Masakan Bandung",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: heroImageUrl,
        width: 1200,
        height: 630,
        alt: "Hidangan khas Bandung sebagai gambar hero",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [heroImageUrl],
  },
};

export const viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AntdRegistry>
          <CartProvider>
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-8">
              {children}
            </main>
            <AdminFooterCTA />
          </CartProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
