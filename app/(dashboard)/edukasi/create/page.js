"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { isGlobalScope } from "@/lib/utils/auth"
import { LOCATIONS } from "@/lib/rbac"
import { educationService } from "@/services/educationService"
import { uploadMedia } from "@/services/uploadService"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import RichTextEditor from "@/components/RichTextEditor"
import SimpleImagePicker from "@/components/edukasi/SimpleImagePicker"

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

export default function CreateEdukasi() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [audience, setAudience] = useState("Umum")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [pendingFile, setPendingFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [wilayah, setWilayah] = useState("Semua Wilayah")
  const [isAdminGlobal, setIsAdminGlobal] = useState(false)

  useEffect(() => {
    setIsAdminGlobal(isGlobalScope())
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const loadingToast = toast.loading("Mempublikasikan konten edukasi...")

      let finalImageUrl = imageUrl
      // If user selected a local file that hasn't finished direct upload
      if (pendingFile && (!imageUrl || imageUrl.startsWith("blob:") || imageUrl.startsWith("data:"))) {
        finalImageUrl = await uploadMedia(pendingFile)
      }

      const { error } = await educationService.create({
        title,
        category: category || null,
        audience: audience || "Umum",
        content,
        image_url: finalImageUrl || null,
        lokasi: isAdminGlobal ? (wilayah || "Semua Wilayah") : null,
      })

      if (error) throw error

      toast.dismiss(loadingToast)
      toast.success("Konten edukasi berhasil dipublikasikan")

      setTimeout(() => {
        router.push("/edukasi")
      }, 1200)
    } catch (err) {
      console.error(err)
      toast.error("Gagal mempublikasikan konten edukasi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <Link
          href="/edukasi"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Katalog Edukasi
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Tambah Konten Edukasi
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Isi formulir berikut untuk menambahkan materi edukasi kebencanaan baru.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden"
      >
        <div className="p-6 md:p-8 space-y-8">
          {/* Judul */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Judul Edukasi
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
              placeholder="Contoh: Cara Menghadapi Erupsi Gunung Api"
            />
          </div>

          {/* Target Audiens & Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Audiens
              </label>
              <select
                value={audience}
                onChange={(e) => {
                  const newAudience = e.target.value
                  setAudience(newAudience)
                  if (newAudience !== "Umum" && category?.toLowerCase().includes("siaga")) {
                    setCategory("")
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm font-medium"
              >
                {AUDIENCES.map((aud) => (
                  <option key={aud} value={aud}>
                    {aud}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
              >
                <option value="">Pilih kategori (opsional)</option>
                {CATEGORIES.map((cat) => {
                  const isSiaga = cat.toLowerCase().includes("siaga")
                  const isDisabled = audience !== "Umum" && isSiaga
                  return (
                    <option key={cat} value={cat} disabled={isDisabled}>
                      {cat} {isDisabled ? "(Hanya Umum)" : ""}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Wilayah (Khusus Admin Global / MDMC) */}
          {isAdminGlobal && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Wilayah Edukasi
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Isi Konten Edukasi
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Tuliskan materi edukasi lengkap beserta gambar penjelasan di sini..."
            />
          </div>

          {/* Simple Image Picker for Cover */}
          <SimpleImagePicker
            value={imageUrl}
            onChange={setImageUrl}
            onFileSelect={setPendingFile}
          />
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-5 md:px-8 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-white/10 flex items-center justify-end gap-3">
          <Link
            href="/edukasi"
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm focus:ring-4 focus:ring-blue-500/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? "Menyimpan..." : "Simpan & Publikasikan"}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
