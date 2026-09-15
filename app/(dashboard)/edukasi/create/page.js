"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { educationService } from "@/services/educationService"
import { uploadMedia } from "@/services/uploadService"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import WordPressMediaPicker from "@/components/edukasi/WordPressMediaPicker"

const CATEGORIES = [
  "Siaga 1",
  "Siaga 2",
  "Siaga 3",
  "Siaga 4",
]

export default function CreateEdukasi() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [pendingFile, setPendingFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const loadingToast = toast.loading("Mempublikasikan konten edukasi...")

      let finalImageUrl = imageUrl
      // If user selected a local file that hasn't finished direct upload
      if (pendingFile && (!imageUrl || imageUrl.startsWith("blob:"))) {
        finalImageUrl = await uploadMedia(pendingFile)
      }

      const { error } = await educationService.create({
        title,
        category: category || null,
        content,
        image_url: finalImageUrl || null,
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

          {/* Kategori */}
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
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Konten */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Isi Konten Edukasi
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm resize-none"
              rows={10}
              placeholder="Tuliskan materi edukasi lengkap di sini..."
            />
          </div>

          {/* WordPress-Style Media Manager */}
          <WordPressMediaPicker
            value={imageUrl}
            onChange={setImageUrl}
            onFileSelect={setPendingFile}
          />
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
              <>
                <Save className="w-4 h-4" /> Publikasikan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

