# Masakan Bandung

Aplikasi katalog makanan khas Bandung dengan panel admin, integrasi Supabase Storage untuk upload gambar, dan alur checkout via WhatsApp.

## Instalasi

1. Pastikan Node.js 18+ dan npm telah terpasang.
2. Clone repository ini lalu masuk ke folder proyek.
3. Instal dependensi:

```bash
npm install
```

4. Salin file `.env.local.example` menjadi `.env.local` lalu isi setiap variabel.

5. Jalankan Prisma untuk membuat skema database:

```bash
npx prisma db push
```

6. Isi data awal (admin + contoh menu) menggunakan perintah:

```bash
npm run seed
```

## Penggunaan

- **Customer** dapat melihat daftar kategori & menu di halaman utama (`/`), menambah item ke keranjang (`/cart`), lalu membuat format pesan WhatsApp di halaman checkout (`/checkout`).
- **Admin** melakukan login di `/admin/login`, mengelola makanan di `/admin/foods`, menambah data via `/admin/foods/new`, dan mengedit menggunakan `/admin/foods/[id]/edit`.
- Seluruh API berada pada `/api/*` dan dilindungi JWT berbasis cookie untuk operasi admin.

## Cara Menjalankan Secara Lokal

```bash
npm run dev
```

Server lokal akan tersedia di `http://localhost:3000`.

## Deploy ke Vercel

1. Push repository ini ke GitHub.
2. Buat proyek baru di [Vercel](https://vercel.com/new) dan pilih repository.
3. Pada halaman konfigurasi, tambahkan environment variables yang sama seperti `.env.local`.
4. Aktifkan Prisma Data Proxy atau gunakan database produksi seperti Neon (lihat bagian di bawah).
5. Setelah deploy selesai, jalankan `npx prisma migrate deploy` via Vercel CLI / job bila menggunakan migrasi berbasis file.

## Konfigurasi Supabase Storage

1. Buat project di [Supabase](https://supabase.com/).
2. Buat bucket Storage bernama `foods` dan atur policy publik (read-only) agar gambar dapat diakses.
3. Salin **Project URL** dan **anon public key** ke `.env.local` sebagai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Pastikan bucket mengizinkan upload melalui REST API (policy: `insert` oleh anon key) atau gunakan service key bila diperlukan.

## Koneksi ke Neon (PostgreSQL)

1. Buat database PostgreSQL gratis di [Neon](https://neon.tech/).
2. Salin connection string ke variabel `DATABASE_URL` pada `.env.local`.
3. Jalankan `npx prisma migrate deploy` atau `npx prisma db push` untuk menyinkronkan skema.
4. Gunakan koneksi yang sama di Vercel dengan menambahkan variabel `DATABASE_URL` pada pengaturan project.

Selamat membangun dan selamat menikmati Masakan Bandung! 🍲
