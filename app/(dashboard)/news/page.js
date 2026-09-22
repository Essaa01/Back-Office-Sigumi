"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { newsService } from "@/services/newsService"
import { Plus, Newspaper, Calendar, Trash2, Edit, ChevronLeft, ChevronRight, Eye } from "lucide-react"

const ITEMS_PER_PAGE = 6

export default function NewsPage() {
  const [newsList, setNewsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await newsService.getAll()
      if (error) throw error
      setNewsList(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Gagal mengambil data berita")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id) => {
    try {
      if(!window.confirm("Hapus berita ini secara permanen?")) return;
      const loadingToast = toast.loading("Memproses penghapusan...")
      await newsService.delete(id)
      toast.dismiss(loadingToast)
      toast.success("Berita berhasil dihapus")
      fetchData()
    } catch (err) {
      toast.error("Gagal menghapus berita")
    }
  }

  const totalPages = Math.ceil(newsList.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedNews = newsList.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [newsList.length, totalPages, currentPage])

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Berita & Publikasi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manajemen rilis pers, artikel edukasi, dan pengumuman.
          </p>
        </div>

        <Link
          href="/news/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors focus:ring-4 focus:ring-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Tulis Berita
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && newsList.length === 0 && (
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
            <Newspaper className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada publikasi berita.</p>
        </div>
      )}

      {/* Grid List */}
      {!loading && paginatedNews.length > 0 && (
         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedNews.map((news) => (
               <div key={news.id} className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  {/* Image */}
                  <div className="relative h-48 md:h-52 w-full bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 shrink-0 overflow-hidden">
                    {news.image_url ? (
                        <img 
                            src={news.image_url} 
                            alt={news.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                            <Newspaper className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-md border shadow-xs bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                            {news.lokasi || "Semua Wilayah"}
                        </span>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/news/${news.id}`} className="p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
                            <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/news/${news.id}/edit`} className="p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
                            <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(news.id)} className="p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 rounded-md">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug">
                          {news.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 mb-4">
                          {news.content}
                      </p>
                      
                      {/* Meta Footer */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-white/5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(news.created_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "long", year: "numeric"
                          })}</span>
                      </div>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
         <div className="flex items-center justify-between bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl px-6 py-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
               Halaman {currentPage} dari {totalPages}
            </span>
            
            <div className="flex gap-2">
               <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
         </div>
      )}
    </div>
  )
}