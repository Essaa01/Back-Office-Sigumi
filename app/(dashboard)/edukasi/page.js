"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { educationService } from "@/services/educationService"
import { Plus, BookOpen, Calendar, Trash2, Edit, ChevronLeft, ChevronRight, Eye, Filter } from "lucide-react"
import EducationalMediaViewer from "@/components/edukasi/EducationalMediaViewer"

const ITEMS_PER_PAGE = 6

const CATEGORIES = [
  "Siaga 1",
  "Siaga 2",
  "Siaga 3",
  "Siaga 4",
]

const AUDIENCES = [
  "Umum",
  "Anak-Anak",
  "Difabel",
]

const categoryColors = {
  "Siaga 1": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  "Siaga 2": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  "Siaga 3": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  "Siaga 4": "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
}

const audienceColors = {
  "Umum": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  "Anak-Anak": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
  "Difabel": "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
}

export default function EdukasiPage() {
  const [edukasiList, setEdukasiList] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedAudience, setSelectedAudience] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await educationService.getAll()
      if (error) throw error
      setEdukasiList(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Gagal mengambil data edukasi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("Hapus konten edukasi ini secara permanen?")) return
      const loadingToast = toast.loading("Memproses penghapusan...")
      await educationService.delete(id)
      toast.dismiss(loadingToast)
      toast.success("Konten edukasi berhasil dihapus")
      fetchData()
    } catch (err) {
      toast.error("Gagal menghapus konten edukasi")
    }
  }

  const filteredList = edukasiList.filter((item) => {
    const matchCategory = !selectedCategory || item.category === selectedCategory
    const matchAudience = !selectedAudience || (item.audience || "Umum") === selectedAudience
    return matchCategory && matchAudience
  })

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedList = filteredList.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [filteredList.length, totalPages, currentPage])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, selectedAudience])

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Konten Edukasi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola materi edukasi kebencanaan untuk aplikasi mobile.
          </p>
        </div>

        <Link
          href="/edukasi/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors focus:ring-4 focus:ring-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Tambah Edukasi
        </Link>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col gap-3 mb-6 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl p-4">
        {/* Audience Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">
            <Filter className="w-3.5 h-3.5" />
            <span>Audiens:</span>
          </div>
          <button
            onClick={() => setSelectedAudience("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedAudience === ""
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-transparent dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/5"
            }`}
          >
            Semua Audiens
          </button>
          {AUDIENCES.map((aud) => (
            <button
              key={aud}
              onClick={() => setSelectedAudience(aud)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selectedAudience === aud
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-transparent dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/5"
              }`}
            >
              {aud}
            </button>
          ))}
        </div>

        <div className="h-px bg-gray-100 dark:bg-white/5" />

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">
            <Filter className="w-3.5 h-3.5" />
            <span>Kategori:</span>
          </div>
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedCategory === ""
                ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-transparent dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/5"
            }`}
          >
            Semua
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selectedCategory === cat
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-transparent dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && filteredList.length === 0 && (
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {selectedCategory
              ? `Belum ada konten edukasi untuk kategori "${selectedCategory}".`
              : "Belum ada konten edukasi."}
          </p>
        </div>
      )}

      {/* Grid List */}
      {!loading && paginatedList.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedList.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
            >
              {/* Image */}
              <div className="relative h-48 md:h-52 w-full bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 shrink-0 overflow-hidden">
                {item.image_url ? (
                  <div className="absolute inset-0 w-full h-full">
                    <EducationalMediaViewer
                      src={item.image_url}
                      alt={item.title}
                      showBadge={true}
                      isThumbnail={true}
                      objectFit="cover"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                {/* Category & Audience Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border shadow-xs ${audienceColors[item.audience] || "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"}`}>
                    {item.audience || "Umum"}
                  </span>
                  {item.category && (
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border shadow-xs ${categoryColors[item.category] || "bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"}`}>
                      {item.category}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-md border shadow-xs bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                    {item.lokasi || "Semua Wilayah"}
                  </span>
                </div>
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/edukasi/${item.id}`}
                    className="p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-md"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/edukasi/${item.id}/edit`}
                    className="p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-md"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p 
                  className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 mb-4"
                  dangerouslySetInnerHTML={{ __html: item.content?.replace(/<[^>]*>?/gm, '') }}
                />

                {/* Meta Footer */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-white/5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
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
