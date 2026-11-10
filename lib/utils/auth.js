import { canAccessMenu, getDefaultRoute } from "../rbac.js"

const SESSION_COOKIE_NAME = "sigumi_session"
const ROLE_COOKIE_NAME = "sigumi_role"
const COOKIE_MAX_AGE_SEC = 60 * 60 // 1 hour

/**
 * Sync session cookies in browser so Next.js Proxy and navigation guards know auth state.
 * @param {string} role
 */
export const syncSessionCookie = (role) => {
  if (typeof document === "undefined") return
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`
  if (role) {
    document.cookie = `${ROLE_COOKIE_NAME}=${encodeURIComponent(role)}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`
  }
}

/**
 * Clear session cookies in browser.
 */
export const clearSessionCookie = () => {
  if (typeof document === "undefined") return
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

/**
 * Save admin session to localStorage and cookies.
 * @param {{ id: string|number, email: string, lokasi: string|null, role: string }} adminObj
 */
export const setAdminSession = (adminObj) => {
  if (typeof window === "undefined") return
  localStorage.setItem(
    "adminData",
    JSON.stringify({
      id: adminObj.id,
      email: adminObj.email,
      lokasi: adminObj.lokasi,
      role: adminObj.role,
    })
  )
  localStorage.setItem("lastActivity", Date.now().toString())
  syncSessionCookie(adminObj.role)
}

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
 * Update the last activity timestamp in localStorage and refresh session cookie.
 */
export const updateLastActivity = () => {
  if (typeof window === "undefined") return
  localStorage.setItem("lastActivity", Date.now().toString())
  const role = getAdminRole()
  if (role) {
    syncSessionCookie(role)
  }
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
 * Clear all admin session data from storage and cookies.
 */
export const clearAdminSession = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem("adminData")
  localStorage.removeItem("lastActivity")
  clearSessionCookie()
}

/**
 * Validate current admin session synchronously.
 * Ensures cookie is synced if valid, or clears storage/cookie if invalid/expired.
 * @returns {{ valid: boolean, expired: boolean, admin: object|null, defaultRoute: string }}
 */
export const validateAdminSession = () => {
  if (typeof window === "undefined") {
    return { valid: false, expired: false, admin: null, defaultRoute: "/login" }
  }

  const admin = getAdminData()
  if (!admin || !admin.role) {
    clearAdminSession()
    return { valid: false, expired: false, admin: null, defaultRoute: "/login" }
  }

  const last = getLastActivity()
  if (last && Date.now() - last > SESSION_TIMEOUT_MS) {
    clearAdminSession()
    return { valid: false, expired: true, admin: null, defaultRoute: "/login" }
  }

  if (!last) {
    localStorage.setItem("lastActivity", Date.now().toString())
  }

  syncSessionCookie(admin.role)
  const defaultRoute = getDefaultRoute(admin.role)
  return { valid: true, expired: false, admin, defaultRoute }
}


