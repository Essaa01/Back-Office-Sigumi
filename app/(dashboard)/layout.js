"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import { Loader2 } from "lucide-react"
import { resolveMenuKey, canAccessMenu } from "@/lib/rbac"
import { toast } from "sonner"
import {
  SESSION_TIMEOUT_MS,
  clearAdminSession,
  getLastActivity,
  updateLastActivity,
  validateAdminSession,
} from "@/lib/utils/auth"

export default function Layout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const lastUpdateRef = useRef(0)
  const historyGuardInitializedRef = useRef(false)

  // Logout due to session timeout
  const handleSessionTimeout = useCallback(() => {
    setIsAuthorized(false)
    clearAdminSession()
    toast.error("Sesi telah berakhir karena tidak ada aktivitas selama 1 jam. Silakan login kembali.")
    window.location.replace("/login")
  }, [])

  // Verify session and route access
  const verifyAccess = useCallback(() => {
    const { valid, expired, admin, defaultRoute } = validateAdminSession()

    if (!valid || !admin) {
      setIsAuthorized(false)
      if (expired) {
        toast.error("Sesi telah berakhir karena tidak ada aktivitas selama 1 jam. Silakan login kembali.")
      }
      window.location.replace("/login")
      return false
    }

    const { role, lokasi } = admin

    // Route guard: resolve current path to a menu key, then check permission
    const menuKey = resolveMenuKey(pathname)
    if (menuKey !== null && !canAccessMenu(role, menuKey, lokasi)) {
      router.replace(defaultRoute)
      return false
    }

    setIsAuthorized(true)
    return true
  }, [pathname, router])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const ok = verifyAccess()
    if (!ok) return

    // Push a history guard on initial dashboard load so clicking browser Back from beranda does not leave dashboard
    if (!historyGuardInitializedRef.current) {
      historyGuardInitializedRef.current = true
      window.history.pushState({ dashboardGuard: true }, "", window.location.href)
    }
  }, [verifyAccess])

  // Track user activity, bfcache pageshow, popstate (Back/Forward), and cross-tab logout
  useEffect(() => {
    if (!isAuthorized) return

    const recordActivity = () => {
      const now = Date.now()
      if (now - lastUpdateRef.current > 15000) {
        lastUpdateRef.current = now
        updateLastActivity()
      }
    }

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ]

    activityEvents.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true })
    })

    const interval = setInterval(() => {
      const last = getLastActivity()
      if (last && Date.now() - last > SESSION_TIMEOUT_MS) {
        handleSessionTimeout()
      }
    }, 15000)

    const handleStorageChange = (e) => {
      if (e.key === "adminData" && !e.newValue) {
        setIsAuthorized(false)
        clearAdminSession()
        window.location.replace("/login")
      }
    }

    const handlePopState = () => {
      const { valid, defaultRoute } = validateAdminSession()
      if (!valid) {
        setIsAuthorized(false)
        window.location.replace("/login")
        return
      }
      if (window.location.pathname === "/login") {
        window.location.replace(defaultRoute)
        return
      }
      // Re-anchor history guard if user pressed Back all the way to the initial dashboard entry
      if (window.location.pathname === defaultRoute) {
        window.history.pushState({ dashboardGuard: true }, "", window.location.href)
      }
    }

    const handlePageShow = (e) => {
      if (e.persisted || !validateAdminSession().valid) {
        verifyAccess()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("popstate", handlePopState)
    window.addEventListener("pageshow", handlePageShow)

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, recordActivity)
      })
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [isAuthorized, handleSessionTimeout, verifyAccess])

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f5f0e6] dark:bg-[#0f0f1a]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Memverifikasi Sesi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto
        bg-[#f5f0e6] dark:bg-[#0f0f1a]
        transition-colors duration-300">
        {children}
      </main>
    </div>
  )
}