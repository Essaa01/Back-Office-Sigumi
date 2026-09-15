"use client"

import { useEffect, useState } from "react"
import { userService } from "@/services/userService"
import { toast } from "sonner"
import { Users as UsersIcon, Search, Trash2, Calendar, ShieldCheck, Mail, Phone, MoreVertical } from "lucide-react"
import Link from "next/link"

const ITEMS_PER_PAGE = 10

function formatDate(dateStr) {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await userService.getAll()
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Gagal mengambil data pengguna")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // SEARCH
  const filtered = users.filter((u) => {
    if (search === "") return true
    return u.full_name?.toLowerCase().includes(search.toLowerCase())
  })

  // PAGINATION
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [filtered.length, totalPages, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  // DELETE
  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus pengguna "${name}" secara permanen?`)) return
    try {
      const loadingToast = toast.loading("Memproses penghapusan...")
      await userService.delete(id)
      toast.dismiss(loadingToast)
      toast.success("Pengguna berhasil dihapus")
      fetchData()
    } catch (err) {
      toast.error("Gagal menghapus pengguna")
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Users Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola data dan hak akses para pengguna sistem.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-sm flex flex-col">
           <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Akun</span>
           <span className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</span>
        </div>
        <div className="p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-sm flex flex-col">
           <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Pencarian</span>
           <span className="text-2xl font-bold text-gray-900 dark:text-white">{filtered.length}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-medium tracking-wide">
              <tr>
                <th className="px-6 py-4">Informasi Pengguna</th>
                <th className="px-6 py-4">ID Akun</th>
                <th className="px-6 py-4">Tgl Bergabung</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    <div className="inline-flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                       Memuat data...
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <UsersIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{search ? "Tidak ada pengguna yang sesuai" : "Belum ada rekaman pengguna"}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800/50">
                          {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                            {user.full_name || "-"}
                            </span>
                            {/* Assuming there might be email or role, showing a placeholder for aesthetics */}
                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><ShieldCheck className="w-3 h-3"/> Standard User</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[150px] inline-block">
                        {user.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(user.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                            onClick={() => handleDelete(user.id, user.full_name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                            title="Hapus"
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Menampilkan {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} data
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
