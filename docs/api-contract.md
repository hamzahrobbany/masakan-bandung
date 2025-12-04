# API Contract

## Response Envelope
Setiap endpoint mengembalikan bentuk respons seragam:

```json
{
  "success": true,
  "data": {}
}
```

Untuk error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Penjelasan singkat",
    "details": {}
  }
}
```

`data` dan `details` bersifat opsional dan hanya dikirim bila ada informasi tambahan.

## Error Codes
| Code | Deskripsi |
| --- | --- |
| `VALIDATION_ERROR` | Data yang dikirim tidak sesuai skema atau parameter tidak valid. |
| `UNAUTHORIZED` | Permintaan tidak memiliki sesi admin yang valid. |
| `RATE_LIMITED` | Permintaan diblokir karena melewati batas rate limit. |
| `FOOD_FETCH_FAILED` | Gagal memuat daftar makanan. |
| `FOOD_CREATE_FAILED` | Gagal membuat data makanan baru. |
| `CATEGORY_FETCH_FAILED` | Gagal memuat daftar kategori. |
| `CATEGORY_CREATE_FAILED` | Gagal membuat kategori baru. |
| `CATEGORY_NOT_FOUND` | Kategori yang diminta tidak ditemukan. |
| `ORDER_FETCH_FAILED` | Gagal memuat daftar pesanan. |
| `ORDER_CREATE_FAILED` | Gagal membuat pesanan. |
| `ORDER_DETAIL_FETCH_FAILED` | Gagal memuat detail menu pada pesanan. |
| `FOOD_NOT_FOUND` | Ada menu yang diminta tetapi tidak ditemukan. |
| `FOOD_UNAVAILABLE` | Menu ada namun sedang tidak tersedia. |
| `INSUFFICIENT_STOCK` | Stok menu tidak mencukupi. |
| `MENU_NOT_FOUND` | Permintaan detail menu publik tidak menemukan data. |
| `UPLOAD_FILE_NOT_FOUND` | File unggahan tidak ditemukan pada permintaan. |
| `UPLOAD_INVALID` | File yang diunggah tidak memenuhi kriteria. |
| `UPLOAD_FAILED` | Gagal memproses unggahan file. |
| `ADMIN_SESSION_ERROR` | Terjadi kesalahan server saat memuat sesi admin. |
