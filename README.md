# Masakan Bandung

Aplikasi katalog kuliner berbasis Next.js 15 dengan panel admin, upload gambar ke Supabase Storage, database PostgreSQL via Prisma, dan proses checkout yang otomatis menyiapkan pesan WhatsApp.

## Fitur
- Landing page menampilkan kategori dan daftar makanan lengkap dengan tombol "Tambah ke Keranjang".
- Keranjang dan checkout berbasis localStorage yang men-generate format pesan WhatsApp sesuai jumlah item.
- Panel admin mencakup login berbasis cookie JWT, daftar makanan, tambah, serta edit data.
- API CRUD untuk admin, kategori, makanan, dan endpoint upload ke Supabase Storage.
- Prisma schema & seed untuk membuat data awal admin, kategori, serta contoh makanan.

## Prasyarat
- Node.js 18+ dan npm 10+.
- Database PostgreSQL (contoh: [Neon](https://neon.tech/)).
- Project Supabase dengan bucket publik bernama `masakan-bandung`.
- Nomor WhatsApp admin yang aktif.

## Cara Install
1. Clone repositori lalu masuk ke folder proyek.
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Duplikasi file `.env.example` menjadi `.env.local`, kemudian isi seluruh variabel (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `JWT_SECRET`, `ADMIN_SECRET`, dan nomor WhatsApp admin).
4. Jalankan perintah pembangunan awal Prisma (pilih salah satu):
   ```bash
   npx prisma migrate dev --name init
   ```
   atau
   ```bash
   npx prisma db push
   ```
5. Isi data contoh admin + menu:
   ```bash
   npm run seed
   ```
6. Jalankan aplikasi pengembangan:
   ```bash
   npm run dev
   ```

## Cara Menjalankan Prisma Migrate di Lingkungan Lain
1. Pastikan variabel `DATABASE_URL` menunjuk ke database target.
2. Jalankan migrasi file yang tersimpan:
   ```bash
   npx prisma migrate deploy
   ```
3. Bila menggunakan pendekatan schema push (misal untuk staging), gunakan:
   ```bash
   npx prisma db push
   ```
4. Setelah migrasi berhasil, jalankan seed bila dibutuhkan:
   ```bash
   npm run seed
   ```

## Cara Setup Supabase Bucket
1. Masuk ke dashboard Supabase → Storage → buat bucket publik bernama `masakan-bandung`.
2. Aktifkan Row Level Security lalu jalankan SQL pada `supabase/policies.sql` agar hanya role `admin` yang bisa menulis dan publik tetap dapat membaca.
3. Catat **Project URL**, **anon key**, dan **service role key** lalu isi ke `.env.local` sebagai `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, serta `SUPABASE_SERVICE_ROLE_KEY`. Jangan lupa tetapkan `SUPABASE_BUCKET="masakan-bandung"`.
4. Pada bucket, buat folder `uploads/` untuk file makanan agar tetap rapi.
5. Pastikan role `admin` tersedia di JWT Supabase bila ingin memakai policy role-based.

## Cara Deploy ke Vercel
1. Push repositori ini ke GitHub (atau penyedia Git lainnya).
2. Di Vercel, buat project baru dan pilih repositori tersebut.
3. Pada tab **Environment Variables**, isikan seluruh variabel dari `.env.local` (DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET, NEXT_PUBLIC_ADMIN_WHATSAPP, JWT_SECRET, ADMIN_SECRET).
4. Aktifkan Prisma Data Proxy atau gunakan koneksi langsung ke database produksi (misal Neon). Pastikan database dapat diakses oleh Vercel.
5. Setelah deploy berhasil, jalankan migrasi produksi:
   ```bash
   npx prisma migrate deploy
   ```
   (dapat dijalankan lewat Vercel CLI, job terjadwal, atau workflow CI).
6. Jalankan `npm run seed` pada lingkungan produksi bila membutuhkan data awal.

## Demo Commands
```bash
npm run dev      # Menjalankan Next.js dalam mode pengembangan
npm run build    # Membuat output produksi
npm start        # Menjalankan server Next.js produksi
npm run seed     # Menyisipkan data contoh (admin, kategori, makanan)
```

## Uji Manual Admin Orders
Setelah endpoint POST `/api/orders` aktif (checkout publik tersedia), jalankan uji manual ini:

1. Buka aplikasi (`npm run dev`) lalu kirim request POST ke `http://localhost:3000/api/orders` dengan payload contoh:
   ```json
   {
     "customerName": "Tester",
     "customerPhone": "+6212345",
     "note": "catatan",
     "items": [
       { "foodId": "<food-id-valid>", "quantity": 1 }
     ]
   }
   ```
2. Masuk ke `/admin/orders`, pastikan pesanan baru muncul di daftar.
3. Ubah status pesanan (PENDING → PROCESSED/DONE/CANCELLED) dan pastikan UI memperbarui status tanpa error.

Selamat menggunakan Masakan Bandung dan semoga lancar berjualan! 🍲
