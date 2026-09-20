/**
 * RBAC — Role-Based Access Control Config
 * Central source of truth for roles, menus, and permission matrix.
 */

// Available roles (must match DB CHECK constraint)
export const ROLES = {
  BPBD: "BPBD",
  MDMC: "MDMC",
  DINAS: "Dinas Pariwisata",
}

// Available locations
export const LOCATIONS = {
  YOGYA: "Yogya",
  BALI: "Bali",
  LOMBOK: "Lombok",
  ALL: null, // null = global scope (MDMC)
}

/**
 * Menu keys — corresponds to route segments.
 * Key must match the key used in sidebar menuItems.
 */
export const MENU_KEYS = {
  MENU: "menu",
  NEWS: "news",
  EDUKASI: "edukasi",
  SHELTERS: "shelters",
  TOURISM: "tourism",
  CCTV: "cctv",
  PELAPORAN: "pelaporan",
  USERS: "users",
  TRACKING: "tracking",
}

/**
 * Permission matrix: role → array of allowed menu keys.
 *
 * BPBD         → all EXCEPT tourism
 * MDMC         → all EXCEPT tourism (but global location scope)
 * Dinas Pariwisata → ONLY tourism
 */
export const ROLE_MENU_ACCESS = {
  [ROLES.BPBD]: [
    MENU_KEYS.MENU,
    MENU_KEYS.NEWS,
    MENU_KEYS.EDUKASI,
    MENU_KEYS.SHELTERS,
    MENU_KEYS.CCTV,
    MENU_KEYS.PELAPORAN,
    MENU_KEYS.USERS,
    MENU_KEYS.TRACKING,
  ],
  [ROLES.MDMC]: [
    MENU_KEYS.MENU,
    MENU_KEYS.NEWS,
    MENU_KEYS.EDUKASI,
    MENU_KEYS.SHELTERS,
    MENU_KEYS.CCTV,
    MENU_KEYS.PELAPORAN,
    MENU_KEYS.USERS,
    MENU_KEYS.TRACKING,
  ],
  [ROLES.DINAS]: [MENU_KEYS.TOURISM],
}

/**
 * Menu key → route prefix mapping.
 * Used by layout guard to resolve current route → menu key.
 */
export const MENU_ROUTES = {
  [MENU_KEYS.MENU]: "/menu",
  [MENU_KEYS.NEWS]: "/news",
  [MENU_KEYS.EDUKASI]: "/edukasi",
  [MENU_KEYS.SHELTERS]: "/shelters",
  [MENU_KEYS.TOURISM]: "/tourism",
  [MENU_KEYS.CCTV]: "/cctv",
  [MENU_KEYS.PELAPORAN]: "/pelaporan",
  [MENU_KEYS.USERS]: "/users",
  [MENU_KEYS.TRACKING]: "/tracking",
}

/**
 * Get allowed menu keys for a given role.
 * Returns empty array for unknown roles (deny all).
 * @param {string} role
 * @returns {string[]}
 */
export function getAllowedMenuKeys(role) {
  return ROLE_MENU_ACCESS[role] ?? []
}

/**
 * Check if a role can access a specific menu key.
 * @param {string} role
 * @param {string} menuKey
 * @param {string} [lokasi] - Optional location for fine-grained access
 * @returns {boolean}
 */
export function canAccessMenu(role, menuKey, lokasi = null) {
  // Spesifik rule: Tracking hanya untuk MDMC dan BPBD Lombok
  if (menuKey === MENU_KEYS.TRACKING) {
    if (role === ROLES.MDMC) return true
    if (role === ROLES.BPBD && lokasi === LOCATIONS.LOMBOK) return true
    return false
  }
  
  return getAllowedMenuKeys(role).includes(menuKey)
}

/**
 * Get the first allowed route for a role (used for redirect after login).
 * @param {string} role
 * @returns {string} route path
 */
export function getDefaultRoute(role) {
  const keys = getAllowedMenuKeys(role)
  if (keys.length === 0) return "/login"
  return MENU_ROUTES[keys[0]] ?? "/login"
}

/**
 * Resolve current pathname → menu key.
 * Returns null if no match.
 * @param {string} pathname
 * @returns {string|null}
 */
export function resolveMenuKey(pathname) {
  // Sort by length desc so /shelters doesn't match before /shelters/create etc
  const entries = Object.entries(MENU_ROUTES).sort(
    ([, a], [, b]) => b.length - a.length
  )
  for (const [key, route] of entries) {
    if (route === "/menu") {
      if (pathname === "/menu" || pathname === "/") return key
    } else if (pathname.startsWith(route)) {
      return key
    }
  }
  return null
}
