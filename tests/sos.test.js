import test from "node:test"
import assert from "node:assert/strict"
import {
  isLocationStale,
  getLocationAge,
  deduplicateAlerts,
  canAdminManageSos,
  findNearestVolcano,
  formatCoordinates,
  SOS_STATUS_CONFIG,
} from "../lib/utils/sos.js"

test("1. Deduplication by id and client_alert_id", () => {
  const alert1 = {
    id: "alert-uuid-1",
    client_alert_id: "client-mobile-001",
    user_id: "user-1",
    latitude: -7.55,
    longitude: 110.45,
    message: "Tolong saya terjatuh",
    status: "open",
    created_at: "2026-11-09T08:00:00Z",
  }

  const alert2 = {
    id: "alert-uuid-2",
    client_alert_id: "client-mobile-002",
    user_id: "user-2",
    latitude: -8.34,
    longitude: 115.51,
    message: "Tersesat di pos 3",
    status: "open",
    created_at: "2026-11-09T08:15:00Z",
  }

  // Initial seed
  const initial = deduplicateAlerts([], [alert1, alert2])
  assert.equal(initial.length, 2, "Harus berisi 2 alert unik")

  // Retry with same client_alert_id from mobile client (idempotent retry)
  const retryAlert1 = {
    id: "alert-uuid-1-retry",
    client_alert_id: "client-mobile-001",
    user_id: "user-1",
    latitude: -7.55,
    longitude: 110.45,
    message: "Tolong saya terjatuh (Updated message)",
    status: "open",
    created_at: "2026-11-09T08:00:00Z",
  }

  const afterRetry = deduplicateAlerts(initial, retryAlert1)
  assert.equal(afterRetry.length, 2, "Jumlah alert tidak boleh bertambah karena client_alert_id sama")
  const found1 = afterRetry.find((a) => a.client_alert_id === "client-mobile-001")
  assert.equal(found1.message, "Tolong saya terjatuh (Updated message)", "Konten alert harus ter-update")

  // Realtime UPDATE by ID
  const updateAlert2 = {
    id: "alert-uuid-2",
    client_alert_id: "client-mobile-002",
    status: "acknowledged",
    acknowledged_at: "2026-11-09T08:20:00Z",
  }

  const afterUpdate = deduplicateAlerts(afterRetry, updateAlert2)
  assert.equal(afterUpdate.length, 2, "Jumlah alert tetap 2")
  const found2 = afterUpdate.find((a) => a.id === "alert-uuid-2")
  assert.equal(found2.status, "acknowledged", "Status harus diperbarui menjadi acknowledged")
  assert.equal(found2.message, "Tersesat di pos 3", "Field lama yang tidak dikirim harus tetap dipertahankan")

  // Reconnect resync with duplicate batch
  const resynced = deduplicateAlerts(afterUpdate, [alert1, alert2])
  assert.equal(resynced.length, 2, "Resync reconnect tidak boleh membuat duplikat")
})

test("2. Sort ranking: open & acknowledged prioritized, then newer created_at", () => {
  const alerts = [
    { id: "1", status: "resolved", created_at: "2026-11-09T09:00:00Z" },
    { id: "2", status: "open", created_at: "2026-11-09T08:00:00Z" },
    { id: "3", status: "acknowledged", created_at: "2026-11-09T08:30:00Z" },
    { id: "4", status: "open", created_at: "2026-11-09T08:45:00Z" },
    { id: "5", status: "cancelled", created_at: "2026-11-09T09:15:00Z" },
  ]

  const sorted = deduplicateAlerts([], alerts)
  const ids = sorted.map((a) => a.id)
  // open (4 newer, then 2), then acknowledged (3), then resolved (1), then cancelled (5)
  assert.deepEqual(ids, ["4", "2", "3", "1", "5"], "Urutan alert harus memprioritaskan open dan acknowledged")
})

test("3. Location age & stale detection (threshold 15 minutes)", () => {
  const now = Date.now()

  // 1. Fresh location (2 minutes ago)
  const freshTime = new Date(now - 2 * 60 * 1000).toISOString()
  const freshCheck = isLocationStale(freshTime, freshTime, 15)
  assert.equal(freshCheck, false, "Lokasi 2 menit lalu tidak boleh ditandai stale")

  const freshAge = getLocationAge(freshTime, freshTime)
  assert.equal(freshAge.isStale, false)
  assert.match(freshAge.ageText, /menit lalu/)
  assert.doesNotMatch(freshAge.ageText, /Usang/, "Lokasi fresh tidak boleh berlabel Usang")

  // 2. Stale location (30 minutes ago)
  const staleTime = new Date(now - 30 * 60 * 1000).toISOString()
  const staleCheck = isLocationStale(staleTime, staleTime, 15)
  assert.equal(staleCheck, true, "Lokasi 30 menit lalu harus ditandai stale")

  const staleAge = getLocationAge(staleTime, staleTime)
  assert.equal(staleAge.isStale, true)
  assert.match(staleAge.ageText, /Lokasi Usang/, "Lokasi 30 menit lalu wajib berlabel Usang")

  // 3. Very old location (5 hours ago)
  const veryOldTime = new Date(now - 5 * 3600 * 1000).toISOString()
  const veryOldAge = getLocationAge(veryOldTime, veryOldTime)
  assert.equal(veryOldAge.isStale, true)
  assert.match(veryOldAge.ageText, /Lokasi Usang \(5 jam lalu\)/)

  // 4. Null location_recorded_at falls back to created_at
  const fallbackAge = getLocationAge(null, freshTime)
  assert.equal(fallbackAge.isStale, false)
})

test("4. Role authorization for SOS management", () => {
  assert.equal(canAdminManageSos("BPBD"), true, "BPBD harus memiliki otorisasi")
  assert.equal(canAdminManageSos("bpbd"), true, "Case-insensitive BPBD harus diizinkan")
  assert.equal(canAdminManageSos("MDMC"), true, "MDMC harus memiliki otorisasi")
  assert.equal(canAdminManageSos("mdmc"), true, "Case-insensitive MDMC harus diizinkan")
  assert.equal(canAdminManageSos("Dinas Pariwisata"), false, "Dinas Pariwisata tidak boleh mengubah SOS")
  assert.equal(canAdminManageSos("Admin Pengelola"), false, "Admin Pengelola tidak boleh mengubah SOS")
  assert.equal(canAdminManageSos(null), false, "Null role harus ditolak")
  assert.equal(canAdminManageSos(""), false, "Empty role harus ditolak")
})

test("5. Nearest volcano calculation and proximity", () => {
  // Koordinat lereng Merapi
  const nearMerapi = findNearestVolcano(-7.58, 110.45)
  assert.ok(nearMerapi, "Harus menemukan gunung terdekat")
  assert.equal(nearMerapi.name, "Gunung Merapi")
  assert.ok(nearMerapi.distanceKm < 10, "Jarak ke puncak Merapi harus realistis (< 10km)")

  // Koordinat lereng Agung
  const nearAgung = findNearestVolcano(-8.35, 115.51)
  assert.equal(nearAgung.name, "Gunung Agung")
  assert.ok(nearAgung.distanceKm < 5)

  // Invalid coordinates
  assert.equal(findNearestVolcano(NaN, 110.45), null)
  assert.equal(findNearestVolcano("invalid", 110.45), null)
})

test("6. Coordinates formatting and Google Maps URL", () => {
  const coords = formatCoordinates(-7.58412, 110.45728)
  assert.equal(coords.display, "-7.58412, 110.45728")
  assert.equal(coords.gmapsUrl, "https://www.google.com/maps?q=-7.58412,110.45728")

  const invalid = formatCoordinates(null, null)
  assert.equal(invalid.display, "Tidak valid")
  assert.equal(invalid.gmapsUrl, "")
})

test("7. SOS status configuration mapping", () => {
  assert.equal(SOS_STATUS_CONFIG.open.nextStatus, "acknowledged")
  assert.equal(SOS_STATUS_CONFIG.acknowledged.nextStatus, "resolved")
  assert.equal(SOS_STATUS_CONFIG.resolved.nextStatus, null, "Resolved adalah status selesai")
  assert.equal(SOS_STATUS_CONFIG.cancelled.nextStatus, null, "Cancelled adalah status terminal")
})

test("8. Profile and Session join fallback preservation", () => {
  const alertWithJoins = {
    id: "alert-1",
    client_alert_id: "c-1",
    user_id: "user-abc",
    session_id: "session-xyz",
    status: "open",
    profile: {
      id: "user-abc",
      full_name: "Budi Santoso",
      phone: "+62812345678",
    },
    session: {
      id: "session-xyz",
      distance_km: 3.4,
    },
  }

  // Incoming realtime update without profile join
  const incomingUpdate = {
    id: "alert-1",
    client_alert_id: "c-1",
    status: "acknowledged",
    acknowledged_at: "2026-11-09T09:00:00Z",
  }

  const merged = deduplicateAlerts([alertWithJoins], incomingUpdate)
  assert.equal(merged[0].status, "acknowledged")
  assert.equal(merged[0].profile?.full_name, "Budi Santoso", "Data profil yang sudah di-join tidak boleh hilang saat update masuk")
  assert.equal(merged[0].session?.distance_km, 3.4, "Data sesi yang sudah di-join tidak boleh hilang saat update masuk")
})

