-- Pastikan bucket "masakan-bandung" sudah dibuat di Storage.
-- SQL berikut mengatur akses publik read dan admin write berdasarkan klaim JWT role.

begin;

-- Mengizinkan publik membaca objek pada bucket masakan-bandung
create policy if not exists "public read masakan-bandung"
  on storage.objects
  for select
  using (bucket_id = 'masakan-bandung');

-- Mengizinkan admin menulis (insert/update/delete) objek pada bucket masakan-bandung
create policy if not exists "admin write masakan-bandung"
  on storage.objects
  for all
  using (
    bucket_id = 'masakan-bandung'
    and auth.jwt()->>'role' = 'admin'
  )
  with check (
    bucket_id = 'masakan-bandung'
    and auth.jwt()->>'role' = 'admin'
  );

commit;
