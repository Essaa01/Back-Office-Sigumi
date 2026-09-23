-- =============================================================================
-- Migration: Admin Pengelola Role
-- Jalankan di Supabase SQL Editor
-- =============================================================================

-- 1. Update CHECK constraint agar menerima nilai "Admin Pengelola"
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;
ALTER TABLE admins ADD CONSTRAINT admins_role_check
  CHECK (role IN ('BPBD', 'MDMC', 'Dinas Pariwisata', 'Admin Pengelola'));

-- 2. Insert contoh akun Admin Pengelola (ubah email/password sesuai kebutuhan)
INSERT INTO admins (email, password, role, lokasi)
VALUES
  ('admin.pengelola@sigumi.id', 'admin123', 'Admin Pengelola', NULL)
ON CONFLICT (email) DO NOTHING;

-- 3. (Opsional) RLS Policy: Admin Pengelola boleh INSERT/UPDATE/DELETE
--    admin dengan role BPBD/MDMC/Dinas Pariwisata
--    Sesuaikan jika tabel admins punya Row Level Security aktif.

-- Contoh policy (aktifkan jika dibutuhkan):
-- CREATE POLICY "admin_pengelola_manage_admins"
-- ON admins
-- FOR ALL
-- USING (
--   (SELECT role FROM admins WHERE id = auth.uid()) = 'Admin Pengelola'
--   AND role IN ('BPBD', 'MDMC', 'Dinas Pariwisata')
-- )
-- WITH CHECK (
--   role IN ('BPBD', 'MDMC', 'Dinas Pariwisata')
-- );
