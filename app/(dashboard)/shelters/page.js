"use client"

import { useEffect, useState } from "react"
import { shelterService } from "@/services/shelterService"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Trash2, Edit, Building, MapPin, Users, Activity, Phone, ExternalLink } from "lucide-react"

const ITEMS_PER_PAGE = 10

export default function SheltersPage() {
  const [shelters, setShelters] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const TYPE_STYLES = {
    puskesmas: { label: "Puskesmas", bg: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
    posko_evakuasi: { label: "Posko Evakuasi", bg: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
    gor: { label: "GOR", bg: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
    rumah_sakit: { label: "Rumah Sakit", bg: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" },
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await shelterService.getAll()
      if (error) throw error
      setShelters(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Gagal mengambil data evakuasi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id) => {
    try {
      if(!window.confirm("Hapus titik evakuasi ini secara permanen?")) return;
      const loadingToast = toast.loading("Menghapus data...")
      await shelterService.delete(id)
      toast.dismiss(loadingToast)
      toast.success("Titik evakuasi berhasil dihapus")
      fetchData()
    } catch (err) {
      toast.error("Gagal menghapus data")
    }
  }

  const totalPages = Math.ceil(shelters.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedShelters = shelters.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [shelters.length, totalPages, currentPage])

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto font-sans">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Data Evakuasi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manajemen operasional posko dan barak pengungsian.
          </p>
        </div>

        <Link
          href="/shelters/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors focus:ring-4 focus:ring-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Tambah Lokasi
        </Link>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <div className="w-full">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 table-fixed">
            <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-medium tracking-wide">
              <tr>
                <th className="px-4 py-4 w-[30%]">Nama Lokasi</th>
                <th className="px-4 py-4 w-[15%]">Tipe</th>
                <th className="px-4 py-4 w-[15%]">Kapasitas</th>
                <th className="px-4 py-4 w-[20%]">Fasilitas</th>
                <th className="px-4 py-4 w-[12%]">Status</th>
                <th className="px-4 py-4 w-[8%] text-right">Aksi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <div className="inline-flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                       Memuat data...
                    </div>
                  </td>
                </tr>
              ) : paginatedShelters.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada data evakuasi</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tambahkan lokasi baru untuk mulai mengelola.</p>
                  </td>
                </tr>
              ) : (
                paginatedShelters.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 break-words">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                           <Building className="w-3.5 h-3.5 text-gray-400" /> 
                           {item.name}
                        {item.lokasi && (
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 w-fit">
                            Wilayah: {item.lokasi}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 mt-1.5">
                           <MapPin className="w-3 h-3" />
                           <span className="truncate max-w-[200px]">{item.address}</span>
                        </span>
                        {item.gmaps_url && (
                          <a 
                            href={item.gmaps_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mt-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Buka di Google Maps
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 break-words">
                      {item.type && TYPE_STYLES[item.type] ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${TYPE_STYLES[item.type].bg}`}>
                          {TYPE_STYLES[item.type].label}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-4 break-words">
                       <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {item.capacity || 0}
                       </span>
                    </td>
                    <td className="px-4 py-4 break-words">
                      <div className="flex gap-2">
                        {item.has_medical && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20">Medis</span>}
                        {item.has_kitchen && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">Dapur</span>}
                        {item.has_toilet && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">Toilet</span>}
                        {!item.has_medical && !item.has_kitchen && !item.has_toilet && <span className="text-gray-400 text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 break-words">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.is_active 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                          : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4 break-words text-right align-middle">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/shelters/${item.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Edit Data"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Hapus Data"
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
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Menampilkan {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, shelters.length)} dari {shelters.length} data
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
