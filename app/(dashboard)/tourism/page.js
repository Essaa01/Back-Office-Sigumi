"use client"

import { useEffect, useState } from "react"
import { tourismService } from "@/services/tourismService"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Trash2, Edit, MapPin, Clock, Star, Map, Camera, ExternalLink } from "lucide-react"

const ITEMS_PER_PAGE = 10

const getImageSrc = (url) => {
  try {
    const imageUrl = new URL(url)
    imageUrl.pathname = imageUrl.pathname
      .split("/")
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
      .join("/")
    return imageUrl.toString()
  } catch {
    return url
  }
}

export default function TourismPage() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await tourismService.getAll()
      if (error) throw error
      setDestinations(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Gagal mengambil data wisata")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id) => {
    try {
      if(!window.confirm("Hapus destinasi wisata ini secara permanen?")) return;
      const loadingToast = toast.loading("Menghapus data...")
      await tourismService.delete(id)
      toast.dismiss(loadingToast)
      toast.success("Destinasi wisata berhasil dihapus")
      fetchData()
    } catch (err) {
      toast.error("Gagal menghapus data")
    }
  }

  const totalPages = Math.ceil(destinations.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedDestinations = destinations.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [destinations.length, totalPages, currentPage])

  const formatCurrency = (amount) => {
      if(!amount) return "Gratis"
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount)
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Destinasi Wisata
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manajemen objek pariwisata di kawasan teritorial.
          </p>
        </div>

        <Link
          href="/tourism/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors focus:ring-4 focus:ring-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Tambah Destinasi
        </Link>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-medium tracking-wide">
              <tr>
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4">Destinasi</th>
                <th className="px-6 py-4">Kategori & Lokasi</th>
                <th className="px-6 py-4">Informasi Tambahan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
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
              ) : paginatedDestinations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada destinasi terdaftar</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Gunakan tombol "Tambah Destinasi" untuk mendaftar baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedDestinations.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group relative">
                    
                    {/* Thumbnail */}
                    <td className="px-6 py-4 whitespace-nowrap pl-6">
                        {item.photo_url ? (
                            <img src={getImageSrc(item.photo_url)} alt={item.name} className="w-10 h-10 rounded object-cover shadow-sm border border-gray-200 dark:border-white/10" />
                        ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10">
                                <Camera className="w-4 h-4 text-gray-400" />
                            </div>
                        )}
                    </td>

                    {/* Name & Desc */}
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col gap-1 max-w-[240px]">
                            <span className="truncate">{item.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal truncate">
                                {item.description || 'Tidak ada deskripsi rinci.'}
                            </span>
                            {item.gmaps_url && (
                              <a 
                                href={item.gmaps_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mt-0.5 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Buka di Google Maps
                              </a>
                            )}
                        </div>
                    </td>

                    {/* Category & Region */}
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col gap-1.5 items-start">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                             {item.category || "Umum"}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                             <Map className="w-3.5 h-3.5" />
                             {item.region || "Belum ditentukan"}
                          </span>
                       </div>
                    </td>

                    {/* Meta info */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                         <div className="flex items-center gap-2">
                             <Clock className="w-3.5 h-3.5 text-gray-400" />
                             <span>{item.open_hours || "08:00 - 17:00"}</span>
                         </div>
                         <div className="flex items-center gap-2 font-medium">
                             <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded">{formatCurrency(item.entry_fee)}</span>
                             <span className="flex items-center gap-1 ml-2 text-amber-600 dark:text-amber-500">
                                <Star className="w-3.5 h-3.5" /> {item.rating || "0.0"}
                             </span>
                         </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right align-middle">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/tourism/${item.id}/edit`}
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
              Menampilkan {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, destinations.length)} dari {destinations.length} data
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
