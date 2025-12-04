# API Error Handling

Semua route API kini menggunakan custom error class dan global handler untuk
mengembalikan format error yang konsisten. Error yang dilemparkan akan
menghasilkan respons JSON dengan struktur berikut:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Parameter tidak valid",
    "details": {
      "error": "Payload tidak valid",
      "details": [
        "Field \"ids\" wajib diisi"
      ]
    }
  }
}
```

Field `code` akan disesuaikan dengan jenis kesalahan (misalnya `NOT_FOUND`,
`UNAUTHORIZED`, atau `RATE_LIMITED`) dan `details` bersifat opsional untuk
memberikan konteks tambahan.
