# Folder Structure Fix Tasks

## 1) Deduplicate FoodForm implementations
- Saat ini ada dua versi `FoodForm` terpisah di `components/FoodForm.tsx` dan `app/admin/foods/components/FoodForm.tsx`, dengan API/validasi berbeda sehingga rentan tidak sinkron.
- Pilih satu lokasi kanonis (mis. `app/admin/foods/components/FoodForm.tsx` atau `components/admin/FoodForm.tsx` jika perlu dipakai ulang), hapus versi duplikat, lalu perbarui seluruh impor di halaman makanan admin (`app/admin/foods/page.tsx`, `app/admin/foods/[id]/page.tsx`, `app/admin/foods/create/*`).

## 2) Pindahkan guard admin ke scope admin
- `AdminProtected` berada di folder global `components/` padahal hanya dipakai di halaman admin.
- Tempatkan komponennya di `app/admin/components` (atau subfolder `components/admin`) supaya pemisahan public/admin jelas, lalu sesuaikan semua impor yang memanggil guard tersebut.

## 3) Rapikan komponen admin yang tidak terpakai
- `app/admin/components/AdminHeader.tsx` belum pernah dipakai, sementara `AdminContent.tsx` kosong.
- Tentukan apakah header akan dipakai di layout; jika tidak, hapus keduanya untuk mengurangi kebisingan di struktur folder atau isi dengan implementasi final jika diperlukan.
