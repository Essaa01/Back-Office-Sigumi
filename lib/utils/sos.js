import { getDistance } from "geolib"
import { ROLES } from "../rbac.js"

export const VOLCANO_COORDS = {
  "merapi":  { name: "Gunung Merapi",  lat: -7.5407, lng: 110.4463 },
  "agung":   { name: "Gunung Agung",   lat: -8.342,  lng: 115.508 },
  "rinjani": { name: "Gunung Rinjani", lat: -8.411,  lng: 116.457 },
}

/**
 * Check if the location is considered stale (> 15 minutes old).
 * Uses location_recorded_at if available; falls back to created_at.
 * @param {string|null} locationRecordedAt
 * @param {string} createdAt
 * @param {number} thresholdMinutes (default 15)
 * @returns {boolean}
 */
export function isLocationStale(locationRecordedAt, createdAt, thresholdMinutes = 15) {
  const timeStr = locationRecordedAt || createdAt
  if (!timeStr) return true

  const recordedTime = new Date(timeStr).getTime()
  if (isNaN(recordedTime)) return true

  const diffMs = Date.now() - recordedTime
  const thresholdMs = thresholdMinutes * 60 * 1000
  return diffMs > thresholdMs
}

/**
 * Formats a date string to Indonesian local time (e.g. "09:51:24 WIB").
 * @param {string|Date} dateStr
 * @param {string} [timeZone="Asia/Jakarta"]
 * @returns {string}
 */
export function formatLocalTime(dateStr, timeZone = "Asia/Jakarta") {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "-"
  return (
    d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone,
    }).replace(/\./g, ":") + " WIB"
  )
}

/**
 * Formats a date string to Indonesian full date & time (e.g. "09 Nov 2026, 09:51:24 WIB").
 * @param {string|Date} dateStr
 * @param {string} [timeZone="Asia/Jakarta"]
 * @returns {string}
 */
export function formatFullDateTime(dateStr, timeZone = "Asia/Jakarta") {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "-"
  return (
    d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    }) +
    ", " +
    formatLocalTime(dateStr, timeZone)
  )
}

/**
 * Returns human-readable age of the location with explicit stale and real-time labeling.
 * Uses exact time from mobile (location_recorded_at or created_at).
 * NEVER labels stale locations as realtime.
 * @param {string|null} locationRecordedAt
 * @param {string} createdAt
 * @param {number} [currentNow] - Optional timestamp for deterministic testing
 * @returns {{ ageText: string, isStale: boolean, isRealtime: boolean, exactTime: string, exactFullDateTime: string, diffSec: number, recordedTime: Date | null }}
 */
export function getLocationAge(locationRecordedAt, createdAt, currentNow = Date.now()) {
  const timeStr = locationRecordedAt || createdAt
  if (!timeStr) {
    return {
      ageText: "Waktu tidak diketahui",
      isStale: true,
      isRealtime: false,
      exactTime: "-",
      exactFullDateTime: "-",
      diffSec: Infinity,
      recordedTime: null,
    }
  }

  const recordedTime = new Date(timeStr)
  if (isNaN(recordedTime.getTime())) {
    return {
      ageText: "Format waktu tidak valid",
      isStale: true,
      isRealtime: false,
      exactTime: "-",
      exactFullDateTime: "-",
      diffSec: Infinity,
      recordedTime: null,
    }
  }

  const diffSec = Math.max(0, Math.floor((currentNow - recordedTime.getTime()) / 1000))
  const isStale = diffSec > 15 * 60 // > 15 minutes is stale
  const isRealtime = diffSec < 60 // < 1 minute is realtime

  let ageText
  if (diffSec < 60) {
    ageText = `${Math.max(1, diffSec)} detik lalu`
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60)
    ageText = `${mins} menit lalu`
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600)
    ageText = `${hours} jam lalu`
  } else {
    const days = Math.floor(diffSec / 86400)
    ageText = `${days} hari lalu`
  }

  if (isStale) {
    ageText = `Lokasi Usang (${ageText})`
  }

  const exactTime = formatLocalTime(timeStr)
  const exactFullDateTime = formatFullDateTime(timeStr)

  return {
    ageText,
    isStale,
    isRealtime,
    exactTime,
    exactFullDateTime,
    diffSec,
    recordedTime,
  }
}

/**
 * Deduplicate alerts based on id and client_alert_id.
 * Merges updates without creating duplicate items in the list.
 * Sorts primarily: open/acknowledged first, then created_at DESC.
 * @param {Array} existingAlerts
 * @param {Array|Object} incoming
 * @returns {Array}
 */
export function deduplicateAlerts(existingAlerts = [], incoming) {
  const incomingList = Array.isArray(incoming) ? incoming : [incoming].filter(Boolean)
  if (incomingList.length === 0) return existingAlerts

  const alertMap = new Map()

  // First seed existing
  for (const alert of existingAlerts) {
    if (!alert) continue
    const key = alert.id || alert.client_alert_id
    if (key) alertMap.set(key, alert)
  }

  // Then merge / update with incoming
  for (const item of incomingList) {
    if (!item) continue

    // Find if already exists by id OR client_alert_id
    let existingKey = null
    if (item.id && alertMap.has(item.id)) {
      existingKey = item.id
    } else if (item.client_alert_id) {
      for (const [k, v] of alertMap.entries()) {
        if (v.client_alert_id === item.client_alert_id) {
          existingKey = k
          break
        }
      }
    }

    if (existingKey) {
      const prev = alertMap.get(existingKey)
      // Merge with precedence to incoming data while preserving joined profile/session if not in incoming
      const merged = {
        ...prev,
        ...item,
        profile: item.profile || prev.profile,
        session: item.session || prev.session,
      }
      alertMap.delete(existingKey)
      const newKey = merged.id || merged.client_alert_id || existingKey
      alertMap.set(newKey, merged)
    } else {
      const newKey = item.id || item.client_alert_id
      if (newKey) {
        alertMap.set(newKey, item)
      }
    }
  }

  const result = Array.from(alertMap.values())

  // Sort: open first, then acknowledged, then resolved, then cancelled, ordered by created_at DESC
  const statusRank = { open: 0, acknowledged: 1, resolved: 2, cancelled: 3 }

  return result.sort((a, b) => {
    const rankA = statusRank[a.status] ?? 4
    const rankB = statusRank[b.status] ?? 4
    if (rankA !== rankB) return rankA - rankB

    const timeA = new Date(a.created_at || 0).getTime()
    const timeB = new Date(b.created_at || 0).getTime()
    return timeB - timeA
  })
}

/**
 * Check if logged-in admin role is authorized to manage SOS alerts.
 * Only BPBD and MDMC have SAR / tracking access.
 * @param {string|null} role
 * @returns {boolean}
 */
export function canAdminManageSos(role) {
  if (!role) return false
  const r = role.toUpperCase()
  return r === ROLES.BPBD.toUpperCase() || r === ROLES.MDMC.toUpperCase()
}

/**
 * Finds the nearest mountain to a coordinate.
 * @param {number} lat
 * @param {number} lng
 * @returns {{ name: string, distanceKm: number } | null}
 */
export function findNearestVolcano(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return null
  }

  let nearest = null
  let minDistanceMeters = Infinity

  for (const key of Object.keys(VOLCANO_COORDS)) {
    const v = VOLCANO_COORDS[key]
    const dist = getDistance({ latitude: lat, longitude: lng }, { latitude: v.lat, longitude: v.lng })
    if (dist < minDistanceMeters) {
      minDistanceMeters = dist
      nearest = {
        name: v.name,
        distanceKm: parseFloat((dist / 1000).toFixed(1)),
      }
    }
  }

  return nearest
}

/**
 * Formats coordinates for display and Google Maps URL.
 * @param {number} lat
 * @param {number} lng
 * @returns {{ display: string, gmapsUrl: string }}
 */
export function formatCoordinates(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return { display: "Tidak valid", gmapsUrl: "" }
  }
  return {
    display: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    gmapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
  }
}

/**
 * UI badge styling config for SOS status.
 */
export const SOS_STATUS_CONFIG = {
  open: {
    label: "Menunggu Penanganan",
    badgeClass: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    dotClass: "bg-red-500 animate-ping",
    actionLabel: "Konfirmasi / Tangani",
    nextStatus: "acknowledged",
  },
  acknowledged: {
    label: "Sedang Ditangani",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    dotClass: "bg-amber-500",
    actionLabel: "Tandai Selesai",
    nextStatus: "resolved",
  },
  resolved: {
    label: "Selesai (Rescued)",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    dotClass: "bg-emerald-500",
    actionLabel: null,
    nextStatus: null,
  },
  cancelled: {
    label: "Dibatalkan",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10",
    dotClass: "bg-gray-400",
    actionLabel: null,
    nextStatus: null,
  },
}
