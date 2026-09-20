"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import ThemeToggle from "@/components/ThemeToggle"
import Image from "next/image"
import { LayoutDashboard, Newspaper, Tent, Map, Video, MessageSquare, Users, LogOut, User, MapPin, X, Lock, Save, Loader2, BookOpen, ShieldCheck, Navigation } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { canAccessMenu } from "@/lib/rbac"

// All possible menu items — each has a `menuKey` matching MENU_KEYS in lib/rbac.js
const ALL_MENU_ITEMS = [
  { href: "/menu",      label: "Menu Utama",       icon: LayoutDashboard, menuKey: "menu" },
  { href: "/news",      label: "News",             icon: Newspaper,        menuKey: "news" },
  { href: "/edukasi",   label: "Edukasi",          icon: BookOpen,         menuKey: "edukasi" },
  { href: "/shelters",  label: "Titik Evakuasi",   icon: Tent,             menuKey: "shelters" },
  { href: "/tourism",   label: "Wisata",           icon: Map,              menuKey: "tourism" },
  { href: "/cctv",      label: "CCTV Gunung",      icon: Video,            menuKey: "cctv" },
  { href: "/pelaporan", label: "Pelaporan Warga",  icon: MessageSquare,    menuKey: "pelaporan" },
  { href: "/users",     label: "Users",            icon: Users,            menuKey: "users" },
  { href: "/tracking",  label: "Tracking Pendaki", icon: Navigation,       menuKey: "tracking" },
]

// Role display config
const ROLE_BADGE_STYLE = {
  "BPBD":             { label: "BPBD",             color: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20" },
  "MDMC":             { label: "MDMC",             color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20" },
  "Dinas Pariwisata": { label: "Dinas Pariwisata", color: "text-green-700  dark:text-green-400  bg-green-50  dark:bg-green-500/10  border-green-100  dark:border-green-500/20" },
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [admin, setAdmin] = useState(null)

  // Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Filter menu items based on role from localStorage
  const menuItems = admin
    ? ALL_MENU_ITEMS.filter((item) => canAccessMenu(admin.role, item.menuKey, admin.lokasi))
    : []

  useEffect(() => {
    // Read admin data from localStorage
    const savedAdmin = localStorage.getItem("adminData")
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("adminData")
    toast.success("Berhasil keluar dari sesi admin")
    router.replace("/login")
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!password) {
      toast.error("Password tidak boleh kosong")
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("admins")
        .update({ password })
        .eq("id", admin.id)
        .select() // Added .select() to check if row was actually updated

      if (error) throw error
      
      if (!data || data.length === 0) {
        throw new Error("Update diblokir oleh RLS database.")
      }

      toast.success("Password berhasil diperbarui")
      setIsProfileOpen(false)
      setPassword("")
    } catch (error) {
      toast.error("Gagal memperbarui: Pastikan RLS di Supabase mengizinkan Update")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <aside className="w-64 h-full flex flex-col
        bg-white dark:bg-[#1a1a2e]
        border-r border-gray-200 dark:border-white/5
        transition-colors duration-300 font-sans">

        {/* Logo / Brand */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-white/10">
          <Link href="/menu" className="flex items-center gap-3">
            <Image
              src="/logo-sigumi.svg"
              alt="Logo Sigumi"
              width={135}
              height={135}
              className="transition-transform duration-300 hover:opacity-80"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 mb-4 font-semibold">
            Navigasi
          </p>

          {menuItems.map((item) => {
            const isActive =
              item.href === "/menu"
                ? pathname === "/menu" || pathname === "/"
                : pathname.startsWith(item.href)

            const IconComponent = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
                )}

                <IconComponent className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'stroke-[2.5px]' : 'stroke-2 group-hover:scale-110'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Admin Profile & Logout */}
        <div className="mt-auto border-t border-gray-200 dark:border-white/10">
          {admin && (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-full text-left px-5 py-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <User size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                    {admin.email?.split('@')[0]}
                  </span>
                  {admin.role && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border w-fit mt-0.5 ${ROLE_BADGE_STYLE[admin.role]?.color ?? "text-gray-500 bg-gray-100 border-gray-200"}`}>
                      {ROLE_BADGE_STYLE[admin.role]?.label ?? admin.role}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-500/20 w-full justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                <MapPin size={12} className="shrink-0" />
                <span>{admin.lokasi ? `Wilayah ${admin.lokasi}` : "Semua Wilayah"}</span>
              </div>
            </button>
          )}

          {/* Theme & Logout Actions */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-gray-50/50 dark:bg-black/10">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pilih Tema</span>
              <ThemeToggle compact />
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors group"
            >
              <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Profile Edit Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Profil Admin</h2>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={admin?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Wilayah
                  </label>
                  <input
                    type="text"
                    value={admin?.lokasi || ''}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm min-w-[120px]"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}