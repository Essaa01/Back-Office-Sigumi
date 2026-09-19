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
  return admin?.role === ROLES.MDMC && !admin?.lokasi
}

/**
 * Check if logged-in admin can access a specific menu key.
 * @param {string} menuKey — key from MENU_KEYS in lib/rbac.js
 * @returns {boolean}
 */
export const hasMenuAccess = (menuKey) => {
  const role = getAdminRole()
  if (!role) return false
  return canAccessMenu(role, menuKey)
}

/**
 * Get all allowed menu keys for logged-in admin.
 * @returns {string[]}
 */
export const getAllowedMenus = () => {
  const role = getAdminRole()
  if (!role) return []
  return getAllowedMenuKeys(role)
}
