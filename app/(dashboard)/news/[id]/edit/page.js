"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { isGlobalScope } from "@/lib/utils/auth"
import { LOCATIONS } from "@/lib/rbac"
import { supabase } from "@/lib/supabase/client"
import { uploadImage } from "@/services/uploadService"
import { newsService } from "@/services/newsService"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Save, ImagePlus, UserCog } from "lucide-react"

export default function EditNews() {
  const { id } = useParams()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [wilayah, setWilayah] = useState("Semua Wilayah")
  const [isAdminGlobal, setIsAdminGlobal] = useState(false)

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await newsService.getById(id)

        if (error || !data) {
          toast.error("Berita tidak ditemukan atau Anda tidak memiliki akses")
          router.push("/news")
          return
        }

        setTitle(data.title)
        setContent(data.content)
        setPreview(data.image_url)
        setWilayah(data.lokasi || "Semua Wilayah")
        setIsAdminGlobal(isGlobalScope())
      } catch (err) {
        toast.error("Gagal memuat data berita")
      }
    }

    if (id) fetchData()
  }, [id])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar")
      return
    }

    if (selectedFile.size > MAX_SIZE) {
      toast.error("Ukuran maksimal file gambar adalah 5MB")
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  const handleUpdate = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const loadingToast = toast.loading("Menyimpan revisi berita...")

      let imageUrl = preview
      if (file) {
        imageUrl = await uploadImage(file)
      }

      await newsService.update(id, {
        title,
        content,
        image_url: imageUrl,
        lokasi: isAdminGlobal ? (wilayah || "Semua Wilayah") : undefined,
      })

      toast.dismiss(loadingToast)
      toast.success("Revisi berita berhasil disimpan")

      setTimeout(() => {
        router.push("/news")
      }, 1200)

    } catch (err) {
      console.error(err)
      toast.error("Gagal menyimpan revisi berita")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Katalog Berita
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Revisi Publikasi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Perbarui judul, isi, atau lampiran gambar pada berita yang sudah diterbitkan.</p>
      </div>

      <form onSubmit={handleUpdate} className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        
        <div className="p-6 md:p-8 space-y-8">
          {/* Judul */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Judul Berita Singkat
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
            />
          </div>

          {/* Wilayah (Khusus Admin Global / MDMC) */}
          {isAdminGlobal && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Wilayah Berita
              </label>
              <select
                value={wilayah}
                onChange={(e) => setWilayah(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
              >
                <option value="Semua Wilayah">Semua Wilayah</option>
                {Object.values(LOCATIONS)
                  .filter(Boolean)
                  .map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Konten */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Isi Konten Berita
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm resize-none"
              rows={8}
            />
          </div>

          {/* Upload File */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
              <span>Ganti Gambar (Opsional)</span>
              {preview && !file && <span className="text-blue-500 text-xs">Mempertahankan gambar lama</span>}
              {file && <span className="text-amber-500 text-xs">Gambar baru dipilih</span>}
            </label>
            <label className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                   <ImagePlus className="w-5 h-5" />
                </div>
                <div className="flex flex-col flex-1">
                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pilih berkas gambar baru...</span>
                   <span className="text-xs text-gray-500 dark:text-gray-500">Maksimal 5MB. Format JPG, PNG, WEBP didukung.</span>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>
          </div>

          {preview && (
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/20 relative group">
              <img
                src={preview}
                className="w-full max-h-[300px] object-contain transition-transform"
                alt="Preview"
              />
            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/5 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors focus:ring-4 focus:ring-blue-500/20"
          >
            {loading ? (
                <>Menyimpan...</>
            ) : (
                <><Save className="w-4 h-4"/> Simpan Revisi</>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}