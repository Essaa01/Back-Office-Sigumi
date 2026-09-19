-- ============================================================
-- SIGUMI BACKOFFICE — RBAC Migration
-- Jalankan di Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- Step 1: Tambah kolom `role` ke tabel admins
-- Nilai default 'BPBD' agar row existing tidak null
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'BPBD'
  CHECK (role IN ('BPBD', 'MDMC', 'Dinas Pariwisata'));

-- ============================================================
-- Step 2: Set role untuk admin yang SUDAH ADA di DB Anda
-- Ganti value pada WHERE sesuai email / lokasi yang ada
-- ============================================================

-- Set MDMC (global scope — lokasi tetap tidak diubah di sini)
-- UPDATE admins SET role = 'MDMC'              WHERE email = 'mdmc@yourdomain.com';

-- Set Dinas Pariwisata
-- UPDATE admins SET role = 'Dinas Pariwisata'  WHERE email = 'pariwisata@yourdomain.com';

-- Contoh: set semua admin yang belum ada role ke BPBD (opsional, sudah di-default)
-- UPDATE admins SET role = 'BPBD' WHERE role IS NULL OR role = '';

-- ============================================================
-- Step 3: Verifikasi hasil
-- ============================================================
SELECT id, email, lokasi, role FROM admins ORDER BY role, lokasi;
