"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import { Loader2 } from "lucide-react"
import { resolveMenuKey, getDefaultRoute, canAccessMenu } from "@/lib/rbac"
import { toast } from "sonner"
import {
  SESSION_TIMEOUT_MS,
  clearAdminSession,
  getLastActivity,
  updateLastActivity,
} from "@/lib/utils/auth"

export default function Layout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const lastUpdateRef = useRef(0)

  // Logout due to session timeout
  const handleSessionTimeout = useCallback(() => {
    clearAdminSession()
    toast.error("Sesi telah berakhir karena tidak ada aktivitas selama 1 jam. Silakan login kembali.")
    router.replace("/login")
  }, [router])

  useEffect(() => {
    const raw = localStorage.getItem("adminData")

    if (!raw) {
      router.replace("/login")
      return
    }

    let adminData
    try {
      adminData = JSON.parse(raw)
    } catch {
      router.replace("/login")
      return
    }

    const role = adminData?.role
    const lokasi = adminData?.lokasi
    if (!role) {
      // Legacy session without role — force re-login
      clearAdminSession()
      router.replace("/login")
      return
    }

    // Check if session has timed out (1 hour idle)
    const last = getLastActivity()
    if (last) {
      if (Date.now() - last > SESSION_TIMEOUT_MS) {
        handleSessionTimeout()
        return
      }
    } else {
      // Initialize if missing
      updateLastActivity()
    }

    // Route guard: resolve current path to a menu key, then check permission
    const menuKey = resolveMenuKey(pathname)
    if (menuKey !== null) {
      if (!canAccessMenu(role, menuKey, lokasi)) {
        // Redirect to first allowed route for this role
        router.replace(getDefaultRoute(role))
        return
      }
    }

    setIsAuthorized(true)
  }, [router, pathname, handleSessionTimeout])

  // Track user activity and auto-logout on 1-hour idle timeout
  useEffect(() => {
    if (!isAuthorized) return

    // Throttle activity updates to once every 15 seconds
    const recordActivity = () => {
      const now = Date.now()
      if (now - lastUpdateRef.current > 15000) {
        lastUpdateRef.current = now
        updateLastActivity()
      }
    }

    // Window events that signify user activity
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

    // Interval to check every 15 seconds if 1 hour has elapsed
    const interval = setInterval(() => {
      const last = getLastActivity()
      if (last && Date.now() - last > SESSION_TIMEOUT_MS) {
        handleSessionTimeout()
      }
    }, 15000)

    // Storage event: sync logout across tabs
    const handleStorageChange = (e) => {
      if (e.key === "adminData" && !e.newValue) {
        router.replace("/login")
      }
    }
    window.addEventListener("storage", handleStorageChange)

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, recordActivity)
      })
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [isAuthorized, handleSessionTimeout, router])

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