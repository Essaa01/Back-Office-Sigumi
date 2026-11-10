"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { setAdminSession, validateAdminSession } from "@/lib/utils/auth"
import { getDefaultRoute } from "@/lib/rbac"
import { toast } from "sonner"
import { Lock, Mail, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const redirectIfAuthenticated = () => {
      const { valid, defaultRoute } = validateAdminSession()
      if (valid) {
        window.location.replace(defaultRoute)
        return true
      }
      return false
    }

    redirectIfAuthenticated()

    const handlePageShow = () => {
      redirectIfAuthenticated()
    }

    const handlePopState = () => {
      redirectIfAuthenticated()
    }

    const handleStorageChange = () => {
      redirectIfAuthenticated()
    }

    window.addEventListener("pageshow", handlePageShow)
    window.addEventListener("popstate", handlePopState)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("pageshow", handlePageShow)
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const cleanEmail = email.trim()

    try {
      let adminData = null

      // 1. Authenticate via server API route (avoids browser HTTPS Mixed-Content & sets HTTP cookies)
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        })

        if (res.ok) {
          const json = await res.json()
          adminData = json?.data ?? null
        } else if (res.status === 401) {
          toast.error("Email atau password yang Anda masukkan salah")
          setIsLoading(false)
          return
        }
      } catch {
        // Fallback to direct client query if server route is unreachable
      }

      // 2. Fallback direct client query if server API didn't return adminData
      if (!adminData) {
        const { data, error } = await supabase
          .from("admins")
          .select("*")
          .ilike("email", cleanEmail)
          .eq("password", password)
          .limit(1)

        if (error || !Array.isArray(data) || data.length === 0) {
          toast.error("Email atau password yang Anda masukkan salah")
          setIsLoading(false)
          return
        }

        adminData = {
          id: data[0].id,
          email: data[0].email,
          lokasi: data[0].lokasi ?? null,
          role: data[0].role || "BPBD",
        }
      }

      // Simpan sesi ke localStorage + cookie
      setAdminSession(adminData)

      toast.success("Selamat Datang Admin!")
      const defaultRoute = getDefaultRoute(adminData.role)
      window.location.replace(defaultRoute)
    } catch {
      toast.error("Terjadi kesalahan saat memproses login")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#f5f0e6] dark:bg-[#121212] px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              SIGUMI
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Login Administrator Wilayah</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors"
                  placeholder="admin@gmail.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center text-xs text-gray-400 dark:text-zinc-500">
            Sistem Geografis Mitigasi © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  )
}