"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import { Loader2 } from "lucide-react"
import { resolveMenuKey, getDefaultRoute, canAccessMenu } from "@/lib/rbac"

export default function Layout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

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
    if (!role) {
      // Legacy session without role — force re-login
      localStorage.removeItem("adminData")
      router.replace("/login")
      return
    }

    // Route guard: resolve current path to a menu key, then check permission
    const menuKey = resolveMenuKey(pathname)
    if (menuKey !== null) {
      if (!canAccessMenu(role, menuKey)) {
        // Redirect to first allowed route for this role
        router.replace(getDefaultRoute(role))
        return
      }
    }

    setIsAuthorized(true)
  }, [router, pathname])

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