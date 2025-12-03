# Architecture Review: Masakan Bandung

## 1. Domain Model & Business Rules
| Temuan | Dampak | Referensi |
| --- | --- | --- |
| Model tidak menyertakan soft-delete atau audit trail pada entitas inti (Category, Food, Order, OrderItem, Admin). | Penghapusan permanen menyulitkan pelacakan perubahan dan pemulihan data ketika admin salah input. | 【F:prisma/schema.prisma†L11-L59】 |
| OrderItem memperbolehkan `foodId` nullable dan menyimpan salinan name/price tanpa menjaga konsistensi harga historis melalui constraint. | Risiko inkonsistensi data ketika Food dihapus atau diubah; kehilangan jejak menu asli jika referensi hilang. | 【F:prisma/schema.prisma†L41-L59】 |
| Tidak ada domain rule terkait batas maksimum jumlah item per order atau validasi nomor telepon/WA. | Potensi spam order atau data kontak tidak dapat digunakan untuk notifikasi. | 【F:app/api/orders/route.ts†L135-L177】 |
| Tidak ada multi-tenant/tenantId atau pemisahan cabang. | Sulit skala ke lebih dari satu outlet tanpa migrasi skema besar. | 【F:prisma/schema.prisma†L11-L71】 |

## 2. Data Flow & Use Case Flow
| Temuan | Dampak | Referensi |
| --- | --- | --- |
| API publik `POST /api/orders` langsung melakukan agregasi dan transaksi DB tanpa abstraksi use-case/service. | Sulit diuji ulang atau disusun ulang (misal integrasi payment) karena logika tersebar di route handler. | 【F:app/api/orders/route.ts†L126-L221】 |
| Validasi payload dilakukan manual dengan casting `unknown` → `Record` tanpa skema terstruktur. | Ketergantungan pada pengecekan ad-hoc, risiko nilai tidak ter-normalisasi terlewat. | 【F:app/api/orders/route.ts†L19-L83】 |
| Alur admin (CRUD makanan/kategori/order) tidak memiliki lapisan aplikasi terpisah; setiap route langsung ke Prisma. | Penambahan aturan bisnis (misal publish/unpublish) memerlukan perubahan di banyak file. | 【F:app/api/admin/foods/route.ts†L31-L121】【F:app/api/admin/foods/[id]/route.ts†L20-L132】 |

## 3. Struktur Folder & Modularisasi
| Temuan | Dampak | Referensi |
| --- | --- | --- |
| Logika domain bercampur dengan adapter Next.js di `app/api/*`; tidak ada folder khusus use-case/service. | Menurunkan keterbacaan dan mempersulit reusability (misal dipakai oleh job/background). | 【F:app/api/orders/route.ts†L126-L221】 |
| Validasi input tersebar di route, sementara ada `lib/food-validation.ts` tetapi tidak dimanfaatkan. | Duplikasi dan ketidakkonsistenan aturan validasi antar endpoint. | 【F:lib/food-validation.ts†L1-L120】【F:app/api/admin/foods/route.ts†L31-L121】 |
| File utilitas keamanan dan auth terpisah (`lib/security.ts`, `lib/auth.ts`, `lib/protect-admin-route.ts`) namun saling ketergantungan tidak dibungkus index/ barrel. | Membingungkan titik masuk; mudah terjadi import siklik saat menambah modul baru. | 【F:lib/security.ts†L1-L6】【F:lib/protect-admin-route.ts†L1-L12】 |

## 4. API Contract (DTO, Validation, Return Shape)
| Temuan | Dampak | Referensi |
| --- | --- | --- |
| DTO tidak terdokumentasi; bentuk response bervariasi (redirect vs JSON) untuk kasus error login. | Menyulitkan klien (web/admin) mengonsumsi API secara konsisten. | 【F:app/api/admin/login/route.ts†L31-L86】 |
| Validasi tipe numeric tidak memeriksa integer/upper bound (contoh `price` hanya non-negatif). | Data berpotensi menyimpan angka pecahan atau ekstrem yang tidak masuk akal. | 【F:app/api/admin/foods/route.ts†L45-L112】 |
| Endpoint `GET /api/orders` mengembalikan `items` saja tanpa metadata order atau versi schema; tidak ada pagination. | Menyulitkan konsumsi dan evolusi API ketika daftar pesanan tumbuh. | 【F:app/api/orders/route.ts†L86-L124】 |

## 5. Service Layer
| Temuan | Dampak | Referensi |
| --- | --- | --- |
| Route handler memuat logika bisnis (pengurangan stok, perhitungan total) tanpa service class/fungsi terdedikasi. | Service menjadi “fat controller”; sulit dites dan direuse. | 【F:app/api/orders/route.ts†L144-L215】 |
| Tidak ada guard untuk mengecek concurrent update stok (hanya decrement di transaksi). | Potensi race condition ketika banyak order pada item stok rendah. | 【F:app/api/orders/route.ts†L184-L215】 |
| Admin CRUD tidak menggunakan transaksi saat memodifikasi relasi (misal hapus kategori tidak mengecek makanan terkait). | Bisa meninggalkan data yatim atau error runtime. | 【F:app/api/admin/categories/[id]/route.ts†L1-L120】 |

## 6. Database Schema
| Temuan | Dampak | Referensi |
| --- | --- | --- |
| `OrderItem.foodId` nullable tanpa `onDelete` cascades yang tegas; hanya relasi optional. | Kehilangan referensi ketika food dihapus tanpa kebijakan jelas. | 【F:prisma/schema.prisma†L41-L59】 |
| Tidak ada index pada kolom yang sering difilter selain yang eksplisit; `OrderItem.foodId` tidak diindeks. | Query laporan berdasarkan food bisa lambat. | 【F:prisma/schema.prisma†L41-L59】 |
| Tidak ada constraint unique untuk kombinasi `OrderItem` per `orderId + foodId`. | Duplikasi item pada satu order tidak terlarang di DB, hanya dicegah di kode. | 【F:prisma/schema.prisma†L41-L59】 |
| Tidak ada enumerasi untuk kategori atau pengaturan rating (float bebas). | Nilai rating bisa di luar batas logis jika validasi terlewat. | 【F:prisma/schema.prisma†L23-L39】 |

## 7. Security
| Temuan | Dampak | Referensi |
| --- | --- | --- |
| CSRF untuk admin hanya berlaku pada method selain OPTIONS; tidak ada rotating token atau SameSite check pada fetch klien. | Potensi bypass jika token bocor; tidak ada rate limit login. | 【F:lib/auth.ts†L176-L219】 |
| Session JWT dibuat manual tanpa signature kid/iat dan tidak di-blacklist saat logout (hanya hapus cookie). | Token reuse tetap valid hingga kadaluarsa; tidak ada refresh rotation. | 【F:lib/auth.ts†L69-L170】 |
| Endpoint publik orders tidak memerlukan captcha/rate-limit. | Rentan spam order/DoS. | 【F:app/api/orders/route.ts†L126-L221】 |

## 8. Error Handling
| Temuan | Dampak | Referensi |
| --- | --- | --- |
| Penanganan error banyak berupa `console.error` + pesan umum; tidak ada kode error terstruktur. | Sulit observasi dan debugging di produksi. | 【F:app/api/orders/route.ts†L120-L221】【F:app/api/admin/foods/route.ts†L12-L121】 |
| Tidak ada fallback untuk parsing JSON gagal di beberapa endpoint admin; asumsi `req.json()` berhasil. | Bisa memicu 500 jika payload tidak valid. | 【F:app/api/admin/foods/route.ts†L31-L121】 |

## 9. Testability & Coverage
| Temuan | Dampak | Referensi |
| --- | --- | --- |
| Tidak ada test unit/e2e di repo (tidak ditemukan folder `__tests__`/`tests`). | Regressi mudah lolos, terutama pada logika stok/order. | (struktur repo) |
| Logika bercampur dengan NextResponse menyulitkan isolasi fungsi untuk diuji. | Memperbesar biaya pembuatan test harness. | 【F:app/api/orders/route.ts†L126-L221】 |

## Risiko Jangka Panjang
| Risiko | Penjelasan |
| --- | --- |
| Skala & maintainability rendah karena logika bisnis tersebar di route tanpa service layer. | Menambah fitur (payment, multi-tenant) akan membutuhkan refactor besar. |
| Keamanan autentikasi kustom tanpa revocation/rate-limit. | Token bocor sulit dicabut; brute force login tidak dilindungi. |
| Data kualitas tidak terjaga (tidak ada constraint unik/enum/soft delete). | Analitik dan audit sulit dipercaya; pemulihan data susah. |

## Rekomendasi Best Practice
| Area | Rekomendasi |
| --- | --- |
| Domain & Schema | Tambahkan soft-delete (`deletedAt`), audit field, unique constraint `orderId+foodId`, dan indeks `OrderItem.foodId`. Gunakan enum/lookup untuk rating atau ganti ke integer skala 1-5. |
| Service Layer | Perkenalkan use-case/service functions (mis. `createOrderService`) terpisah dari route handler; centralize stok check dengan locking/optimistic concurrency. |
| Validation & DTO | Gunakan schema validator (Zod/Valibot) untuk semua request/response; definisikan DTO terversioning dan response envelope konsisten. |
| Security | Tambah rate limiting (login/order), implement session blacklist/rotation, dan gunakan CSRF berbasis token yang di-rotate per sesi. |
| Observability | Gunakan logger terstruktur dan kode error standar; tambahkan tracing untuk transaksi. |
| Testing | Buat unit test untuk service dan integrasi untuk API order/admin; gunakan factory/seed khusus test. |

## Daftar File yang Wajib Ditambah
| File/Folder | Tujuan |
| --- | --- |
| `domain/orders/service.ts` | Mengkapsulasi logika pembuatan order (validasi, stok, transaksi). |
| `domain/foods/service.ts` | Menyediakan operasi CRUD dengan guard relasi kategori & stok. |
| `schemas/*.ts` | Skema DTO (Zod) untuk request/response order, food, category, login. |
| `tests/api/orders.test.ts` | Test integrasi alur order & stok. |
| `tests/unit/orders.service.test.ts` | Unit test service order untuk kasus stok/validasi. |
| `docs/api-contract.md` | Dokumentasi kontrak API dan error codes. |

## Checklist Implementasi
- [ ] Introduksi layer `domain/services` untuk order, food, category, auth.
- [ ] Pindahkan validasi ke skema (Zod) dan gunakan di semua route.
- [ ] Tambah constraint DB: unique `orderId+foodId`, index `OrderItem.foodId`, field audit/soft-delete.
- [ ] Implementasi rate-limit login & order; perkuat CSRF/token rotation.
- [ ] Standarisasi response envelope dan error code.
- [ ] Tambah test unit & integrasi dengan prisma test DB/seed khusus.
- [ ] Lengkapi dokumentasi API & arsitektur.

## Rencana Refactor Bertahap (3 Fase)
1. **Fase 1 – Fondasi**
   - Tambahkan skema Zod untuk request/response utama dan gunakan di route order & login.
   - Perbaiki schema Prisma (index `OrderItem.foodId`, unique `orderId+foodId`, soft-delete minimal `deletedAt` di Food/Category`).
   - Siapkan struktur folder `domain/` untuk service dan pindahkan logika order ke fungsi terpisah.
2. **Fase 2 – Keamanan & Observability**
   - Implementasi rate limiting (middleware) untuk login/order.
   - Tambah CSRF/token rotation dan session blacklist (Redis/in-memory store).
   - Ganti logging ke bentuk terstruktur + standar kode error; dokumentasikan di `docs/api-contract.md`.
3. **Fase 3 – Testing & Ekstensi Fitur**
   - Bangun suite unit & integrasi (orders, foods, auth) menggunakan DB test.
   - Tambahkan guard relasi (hapus kategori/food dengan constraint) dan audit trail.
   - Siapkan dukungan multi-outlet/tenantId bila diperlukan (refactor skema & konfigurasi). 

## Estimasi Skor Kualitas Modul
- **Skor Saat Ini:** 62/100 (stabil untuk MVP namun kurang pada keamanan, test, dan modularitas).
- **Target Setelah Refactor:** 85/100 dengan service layer, validasi terstruktur, dan test memadai.
