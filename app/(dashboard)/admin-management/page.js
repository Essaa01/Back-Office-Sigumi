"use client"

import { useEffect, useState } from "react"
import { adminManagementService } from "@/services/adminManagementService"
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

// ── Modal: Tambah Akun ────────────────────────────────────────────────────────
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
      toast.error(err?.message ?? "Gagal membuat akun")
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

// ── Modal: Edit Akun ──────────────────────────────────────────────────────────
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
      toast.error(err?.message ?? "Gagal memperbarui akun")
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

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ["Semua", "BPBD", "MDMC", "Dinas Pariwisata"]

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("Semua")
  const [modalTambah, setModalTambah] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await adminManagementService.getAll()
      if (error) throw error
      setAdmins(data || [])
    } catch (err) {
      toast.error("Gagal mengambil data admin")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Filter
  const filtered = admins.filter((a) => {
    const matchRole = activeTab === "Semua" || a.role === activeTab
    const matchSearch = a.email?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  // Stats per role
  const stats = {
    total: admins.length,
    BPBD: admins.filter((a) => a.role === "BPBD").length,
    MDMC: admins.filter((a) => a.role === "MDMC").length,
    Dinas: admins.filter((a) => a.role === "Dinas Pariwisata").length,
  }

  const handleDelete = async (id, email) => {
    if (!confirm(`Hapus akun "${email}" secara permanen?`)) return
    try {
      const t = toast.loading("Menghapus akun...")
      await adminManagementService.delete(id)
      toast.dismiss(t)
      toast.success("Akun berhasil dihapus")
      fetchData()
    } catch {
      toast.error("Gagal menghapus akun")
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Admin Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
            Kelola akun admin BPBD, MDMC, dan Dinas Pariwisata.
          </p>
        </div>
        <button
          onClick={() => setModalTambah(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Tambah Admin
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Total Admin</span>
          </div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
        </div>

        {/* BPBD */}
        <div className="p-5 rounded-2xl border border-orange-100 dark:border-orange-500/20 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs text-orange-700 dark:text-orange-400 font-semibold uppercase tracking-wider">BPBD</span>
          </div>
          <span className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.BPBD}</span>
        </div>

        {/* MDMC */}
        <div className="p-5 rounded-2xl border border-purple-100 dark:border-purple-500/20 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs text-purple-700 dark:text-purple-400 font-semibold uppercase tracking-wider">MDMC</span>
          </div>
          <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.MDMC}</span>
        </div>

        {/* Dinas Pariwisata */}
        <div className="p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">Dinas</span>
          </div>
          <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.Dinas}</span>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari email admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memuat data admin...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <UserCog className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      {search ? "Tidak ada admin yang sesuai pencarian" : "Belum ada akun admin"}
                    </p>
                    <button
                      onClick={() => setModalTambah(true)}
                      className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      + Tambah admin pertama
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const cfg = ROLE_CONFIG[a.role] ?? ROLE_CONFIG["BPBD"]
                  const IconRole = cfg.icon
                  const initials = a.email?.substring(0, 2).toUpperCase() || "??"

                  return (
                    <tr key={a.id} className="hover:bg-gray-50/60 dark:hover:bg-white/3 transition-colors group">
                      {/* Admin info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${cfg.card} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                            {initials}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{a.email}</span>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Lokasi */}
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {a.lokasi ?? "Semua Wilayah"}
                        </span>
                      </td>

                      {/* Tanggal */}
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(a.created_at)}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditTarget(a)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id, a.email)}
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

        {/* Footer info */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Menampilkan {filtered.length} dari {admins.length} akun admin
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalTambah && (
        <ModalTambah onClose={() => setModalTambah(false)} onCreated={fetchData} />
      )}
      {editTarget && (
        <ModalEdit admin={editTarget} onClose={() => setEditTarget(null)} onUpdated={fetchData} />
      )}
    </div>
  )
}
