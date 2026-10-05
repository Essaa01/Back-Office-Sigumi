"use client"

import { useEffect, useState } from "react"
import { adminManagementService } from "@/services/adminManagementService"
import { userService } from "@/services/userService"
import { toast } from "sonner"
import {
  UserCog,
  Search,
  Plus,
  Trash2,
  Pencil,
  X,
  Loader2,
  Save,
  Lock,
  Mail,
  MapPin,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Eye,
  EyeOff,
  Calendar,
  UserCheck,
} from "lucide-react"

const ROLES = ["BPBD", "MDMC", "Dinas Pariwisata"]
const LOKASI_OPTIONS = ["Yogyakarta", "Bali", "Lombok"]

const ROLE_CONFIG = {
  BPBD: {
    label: "BPBD",
    icon: ShieldAlert,
    badge: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/15 border-orange-200 dark:border-orange-500/30",
    dot: "bg-orange-500",
    card: "from-orange-500 to-amber-500",
  },
  MDMC: {
    label: "MDMC",
    icon: Shield,
    badge: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/15 border-purple-200 dark:border-purple-500/30",
    dot: "bg-purple-500",
    card: "from-purple-500 to-indigo-500",
  },
  "Dinas Pariwisata": {
    label: "Dinas Pariwisata",
    icon: ShieldCheck,
    badge: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
    card: "from-emerald-500 to-teal-500",
  },
}

function formatDate(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ── Modal: Tambah Akun Admin ──────────────────────────────────────────────────
function ModalTambah({ onClose, onCreated }) {
  const [form, setForm] = useState({ email: "", password: "", role: "BPBD", lokasi: "Yogyakarta" })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const isGlobal = form.role === "MDMC"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const lokasi = isGlobal ? null : form.lokasi
      const { data, error } = await adminManagementService.create({ ...form, lokasi })
      if (error) throw error
      toast.success("Akun admin berhasil dibuat")
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err?.message ?? "Gagal membuat akun admin")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">Tambah Akun Admin</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Lokasi — hide for MDMC */}
          {!isGlobal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Wilayah</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                >
                  {LOKASI_OPTIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isGlobal && (
            <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-500/20">
              MDMC memiliki akses ke semua wilayah (global scope).
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: Edit Akun Admin ────────────────────────────────────────────────────
function ModalEdit({ admin, onClose, onUpdated }) {
  const [password, setPassword] = useState("")
  const [lokasi, setLokasi] = useState(admin.lokasi || "Yogyakarta")
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const isGlobal = admin.role === "MDMC"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {}
      if (password) payload.password = password
      if (!isGlobal) payload.lokasi = lokasi

      const { error } = await adminManagementService.update(admin.id, payload)
      if (error) throw error
      toast.success("Akun admin berhasil diperbarui")
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err?.message ?? "Gagal memperbarui akun admin")
    } finally {
      setLoading(false)
    }
  }

  const cfg = ROLE_CONFIG[admin.role] ?? ROLE_CONFIG["BPBD"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className={`flex items-center justify-between px-6 py-4 border-b border-white/20 bg-gradient-to-r ${cfg.card}`}>
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-white" />
            <h2 className="text-base font-bold text-white">Edit Akun Admin</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={admin.email}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed"
            />
          </div>

          {/* Role (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              <span className="text-xs text-gray-400">Role tidak bisa diubah</span>
            </div>
          </div>

          {/* Lokasi */}
          {!isGlobal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Wilayah</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                >
                  {LOKASI_OPTIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Password baru (opsional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password Baru <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Biarkan kosong jika tidak ingin mengubah"
                className="w-full pl-9 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 bg-gradient-to-r ${cfg.card} text-white text-sm font-medium rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: Edit Akun Pengguna ─────────────────────────────────────────────────
function ModalEditUser({ user, onClose, onUpdated }) {
  const [fullName, setFullName] = useState(user.full_name || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await userService.update(user.id, {
        full_name: fullName,
      })
      if (error) throw error
      toast.success("Data pengguna berhasil diperbarui")
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err?.message ?? "Gagal memperbarui data pengguna")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-white" />
            <h2 className="text-base font-bold text-white">Edit Akun Pengguna</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID Akun</label>
            <input
              type="text"
              value={user.id}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-400 dark:text-gray-500 font-mono text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap pengguna..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const ADMIN_ROLES_TABS = ["Semua", "BPBD", "MDMC", "Dinas Pariwisata"]
const USERS_PER_PAGE = 10

export default function AdminManagementPage() {
  // Top-level tab: 'admins' | 'users'
  const [mainTab, setMainTab] = useState("admins")

  // Admins state
  const [admins, setAdmins] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [searchAdmin, setSearchAdmin] = useState("")
  const [activeRoleTab, setActiveRoleTab] = useState("Semua")
  const [modalTambahAdmin, setModalTambahAdmin] = useState(false)
  const [editAdminTarget, setEditAdminTarget] = useState(null)

  // Users state
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchUser, setSearchUser] = useState("")
  const [currentUserPage, setCurrentUserPage] = useState(1)
  const [editUserTarget, setEditUserTarget] = useState(null)

  // Fetch Admins
  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true)
      const { data, error } = await adminManagementService.getAll()
      if (error) throw error
      setAdmins(data || [])
    } catch (err) {
      toast.error("Gagal mengambil data admin")
    } finally {
      setLoadingAdmins(false)
    }
  }

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const { data, error } = await userService.getAll()
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      toast.error("Gagal mengambil data pengguna")
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
    fetchUsers()
  }, [])

  // Filter admins
  const filteredAdmins = admins.filter((a) => {
    const matchRole = activeRoleTab === "Semua" || a.role === activeRoleTab
    const matchSearch = a.email?.toLowerCase().includes(searchAdmin.toLowerCase())
    return matchRole && matchSearch
  })

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (!searchUser) return true
    const term = searchUser.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(term) ||
      u.id?.toLowerCase().includes(term)
    )
  })

  // Paginated users
  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  const userStartIdx = (currentUserPage - 1) * USERS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(userStartIdx, userStartIdx + USERS_PER_PAGE)

  useEffect(() => {
    if (currentUserPage > totalUserPages && totalUserPages > 0) {
      setCurrentUserPage(totalUserPages)
    }
  }, [filteredUsers.length, totalUserPages, currentUserPage])

  useEffect(() => {
    setCurrentUserPage(1)
  }, [searchUser])

  // Stats
  const adminStats = {
    total: admins.length,
    BPBD: admins.filter((a) => a.role === "BPBD").length,
    MDMC: admins.filter((a) => a.role === "MDMC").length,
    Dinas: admins.filter((a) => a.role === "Dinas Pariwisata").length,
  }

  const handleDeleteAdmin = async (id, email) => {
    if (!confirm(`Hapus akun admin "${email}" secara permanen?`)) return
    try {
      const t = toast.loading("Menghapus akun admin...")
      await adminManagementService.delete(id)
      toast.dismiss(t)
      toast.success("Akun admin berhasil dihapus")
      fetchAdmins()
    } catch {
      toast.error("Gagal menghapus akun admin")
    }
  }

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Hapus akun pengguna "${name || id}" secara permanen?`)) return
    try {
      const t = toast.loading("Menghapus pengguna...")
      await userService.delete(id)
      toast.dismiss(t)
      toast.success("Pengguna berhasil dihapus")
      fetchUsers()
    } catch {
      toast.error("Gagal menghapus pengguna")
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Manajemen Pengelola
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-13">
            Kelola akun administrator wilayah serta akun pengguna sistem.
          </p>
        </div>

        {mainTab === "admins" && (
          <button
            onClick={() => setModalTambahAdmin(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah Admin
          </button>
        )}
      </div>

      {/* Main Switcher: Akun Admin vs Akun User */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit mb-8 border border-gray-200/50 dark:border-white/5">
        <button
          onClick={() => setMainTab("admins")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mainTab === "admins"
              ? "bg-white dark:bg-[#1e1e2d] text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Akun Admin</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
            {admins.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab("users")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mainTab === "users"
              ? "bg-white dark:bg-[#1e1e2d] text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Akun User</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
            {users.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KELOLA AKUN ADMIN                                                  */}
      {/* ========================================================================= */}
      {mainTab === "admins" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Total Admin</span>
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{adminStats.total}</span>
            </div>

            <div className="p-5 rounded-2xl border border-orange-100 dark:border-orange-500/20 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs text-orange-700 dark:text-orange-400 font-semibold uppercase tracking-wider">BPBD</span>
              </div>
              <span className="text-3xl font-bold text-orange-700 dark:text-orange-300">{adminStats.BPBD}</span>
            </div>

            <div className="p-5 rounded-2xl border border-purple-100 dark:border-purple-500/20 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-purple-700 dark:text-purple-400 font-semibold uppercase tracking-wider">MDMC</span>
              </div>
              <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">{adminStats.MDMC}</span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">Dinas</span>
              </div>
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{adminStats.Dinas}</span>
            </div>
          </div>

          {/* Filter Tabs + Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
              {ADMIN_ROLES_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveRoleTab(tab)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeRoleTab === tab
                      ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari email admin..."
                value={searchAdmin}
                onChange={(e) => setSearchAdmin(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Table Admins */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Admin</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Wilayah</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Dibuat</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {loadingAdmins ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Memuat data admin...
                        </div>
                      </td>
                    </tr>
                  ) : filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Shield className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {searchAdmin ? "Tidak ada admin yang sesuai pencarian" : "Belum ada akun admin"}
                        </p>
                        <button
                          onClick={() => setModalTambahAdmin(true)}
                          className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          + Tambah admin pertama
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((a) => {
                      const cfg = ROLE_CONFIG[a.role] ?? ROLE_CONFIG["BPBD"]
                      const initials = a.email?.substring(0, 2).toUpperCase() || "??"

                      return (
                        <tr key={a.id} className="hover:bg-gray-50/60 dark:hover:bg-white/3 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${cfg.card} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                                {initials}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">{a.email}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              {a.lokasi ?? "Semua Wilayah"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(a.created_at)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditAdminTarget(a)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(a.id, a.email)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loadingAdmins && filteredAdmins.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 dark:border-white/5">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Menampilkan {filteredAdmins.length} dari {admins.length} akun admin
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KELOLA AKUN USER                                                   */}
      {/* ========================================================================= */}
      {mainTab === "users" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Akun User</span>
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{users.length}</span>
            </div>

            <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Hasil Filter</span>
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{filteredUsers.length}</span>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama pengguna atau ID..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Data Table Users */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Informasi Pengguna</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">ID Akun</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tgl Bergabung</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-14 text-center text-gray-400">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Memuat data pengguna...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center">
                        <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {searchUser ? "Tidak ada pengguna yang sesuai pencarian" : "Belum ada rekaman pengguna"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/60 dark:hover:bg-white/3 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                              {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {user.full_name || "Tanpa Nama"}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Standard User
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[180px] inline-block bg-gray-100 dark:bg-black/20 px-2 py-1 rounded">
                            {user.id}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(user.created_at)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditUserTarget(user)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit Profil User"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.full_name)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Hapus User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* User Pagination */}
            {totalUserPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Menampilkan {userStartIdx + 1}-{Math.min(userStartIdx + USERS_PER_PAGE, filteredUsers.length)} dari {filteredUsers.length} pengguna
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentUserPage((p) => Math.max(1, p - 1))}
                    disabled={currentUserPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="px-2 text-xs text-gray-500 dark:text-gray-400">
                    Hal {currentUserPage} / {totalUserPages}
                  </span>
                  <button
                    onClick={() => setCurrentUserPage((p) => Math.min(totalUserPages, p + 1))}
                    disabled={currentUserPage === totalUserPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals Admin */}
      {modalTambahAdmin && (
        <ModalTambah onClose={() => setModalTambahAdmin(false)} onCreated={fetchAdmins} />
      )}
      {editAdminTarget && (
        <ModalEdit admin={editAdminTarget} onClose={() => setEditAdminTarget(null)} onUpdated={fetchAdmins} />
      )}

      {/* Modal User */}
      {editUserTarget && (
        <ModalEditUser user={editUserTarget} onClose={() => setEditUserTarget(null)} onUpdated={fetchUsers} />
      )}
    </div>
  )
}
