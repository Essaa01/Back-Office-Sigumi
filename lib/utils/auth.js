import { canAccessMenu, getAllowedMenuKeys, ROLES } from "@/lib/rbac"

/**
 * Get full admin data from localStorage.
 * Shape: { id, email, lokasi, role }
 * @returns {object|null}
 */
export const getAdminData = () => {
  if (typeof window === "undefined") return null

  try {
    const data = localStorage.getItem("adminData")
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error parsing admin data:", error)
    return null
  }
}

/**
 * Get location scope of logged-in admin.
 * Returns null for MDMC (global scope — no location filter).
 * @returns {string|null}
 */
export const getAdminLocation = () => {
  const admin = getAdminData()
  return admin?.lokasi ?? null
}

/**
 * Get role of logged-in admin.
 * @returns {string|null}
 */
export const getAdminRole = () => {
  const admin = getAdminData()
  return admin?.role ?? null
}

/**
 * Check if logged-in admin has global scope (no location filter).
 * Only MDMC with lokasi = null qualifies.
 * @returns {boolean}
 */
export const isGlobalScope = () => {
  const admin = getAdminData()
  if (!admin) return false
  const roleUpper = admin.role?.toUpperCase()
  return roleUpper === "MDMC" || !admin.lokasi || admin.lokasi === "Pusat" || admin.lokasi === "Semua Wilayah"
}

/**
 * Check if logged-in admin can access a specific menu key.
 * @param {string} menuKey — key from MENU_KEYS in lib/rbac.js
 * @returns {boolean}
 */
export const hasMenuAccess = (menuKey) => {
  const role = getAdminRole()
  const lokasi = getAdminLocation()
  if (!role) return false
  return canAccessMenu(role, menuKey, lokasi)
}

/**
 * Session timeout duration: 1 hour in milliseconds
 */
export const SESSION_TIMEOUT_MS = 60 * 60 * 1000

/**
 * Update the last activity timestamp in localStorage.
 */
export const updateLastActivity = () => {
  if (typeof window === "undefined") return
  localStorage.setItem("lastActivity", Date.now().toString())
}

/**
 * Get the last activity timestamp.
 * @returns {number|null}
 */
export const getLastActivity = () => {
  if (typeof window === "undefined") return null
  const val = localStorage.getItem("lastActivity")
  return val ? parseInt(val, 10) : null
}

/**
 * Check if the current session has exceeded the 1-hour idle timeout.
 * @returns {boolean}
 */
export const isSessionExpired = () => {
  const last = getLastActivity()
  if (!last) return false
  return Date.now() - last > SESSION_TIMEOUT_MS
}

/**
 * Clear all admin session data from storage.
 */
export const clearAdminSession = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem("adminData")
  localStorage.removeItem("lastActivity")
}

