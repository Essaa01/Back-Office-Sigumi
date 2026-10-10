"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useParams } from "next/navigation"
import { tourismService } from "@/services/tourismService"
import { uploadImage } from "@/services/uploadService"
import { getAdminLocation } from "@/lib/utils/auth"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Save, MapPin, ImagePlus, ExternalLink, Loader2, Star } from "lucide-react"

export default function EditTourismPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "Alam",
    description: "",
    address: "",
    entry_fee: "",
    open_hours: "08:00 - 17:00",
    rating: "",
    gmaps_url: "",
    photo_url: null
  })
  const adminLocation = getAdminLocation()

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data, error } = await tourismService.getById(params.id)
        if (error) throw error
        
        setFormData({
          ...data,
          entry_fee: data.entry_fee?.toString() || "",
          rating: data.rating !== null && data.rating !== undefined ? data.rating.toString() : "",
          gmaps_url: data.gmaps_url || ""
        })
        if (data.photo_url) {
          setPreview(data.photo_url)
        }
      } catch (err) {
        console.error(err)
        toast.error("Gagal memuat data destinasi")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const loadingToast = toast.loading("Memperbarui destinasi wisata...")

      let imageUrl = formData.photo_url
      if (file) {
        imageUrl = await uploadImage(file)
      }

      let parsedRating = 0.0
      if (formData.rating !== "" && formData.rating !== null && formData.rating !== undefined) {
        parsedRating = Math.min(5, Math.max(0, parseFloat(formData.rating)))
        if (isNaN(parsedRating)) parsedRating = 0.0
      }

      const dataToSave = {
        ...formData,
        photo_url: imageUrl,
        entry_fee: formData.entry_fee ? parseInt(formData.entry_fee) : 0,
        rating: parsedRating
      }
      
      const { error } = await tourismService.update(params.id, dataToSave)
      toast.dismiss(loadingToast)
      
      if (error) throw error

      toast.success("Destinasi wisata berhasil diperbarui")
      router.push("/tourism")
      router.refresh()
    } catch (error) {
      toast.error(error.message || "Gagal memperbarui data")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <Link href="/tourism" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Edit Destinasi Wisata</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Perbarui data objek pariwisata di bawah ini.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        
        <div className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Field Name */}
            <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Destinasi</label>
                <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                placeholder="Contoh: Candi Borobudur"
                />
            </div>
            
            {/* Field Category */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori Wisata</label>
                <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm appearance-none"
                >
                <option value="Alam">Alam / Agrowisata</option>
                <option value="Budaya">Sejarah / Budaya</option>
                <option value="Edukasi">Edukasi</option>
                <option value="Kuliner">Kuliner</option>
                <option value="Hiburan">Rekreasi / Hiburan</option>
                </select>
            </div>

            {/* Fixed Region Info */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Wilayah Regional</label>
                <div className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>{adminLocation || "Nasional"}</span>
                </div>
            </div>
            
            {/* Field Entry Fee */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Biaya Tiket Masuk (Rp)</label>
                <input 
                type="number"
                min="0"
                name="entry_fee"
                value={formData.entry_fee}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                placeholder="45000"
                />
            </div>

            {/* Field Open Hours */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Jam Operasional</label>
                <input 
                name="open_hours"
                value={formData.open_hours}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                placeholder="09:00 - 18:00"
                />
            </div>

            {/* Field Rating */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Rating Destinasi (0.0 - 5.0)
                </label>
                <input 
                type="number"
                step="0.1"
                min="0"
                max="5"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                placeholder="Contoh: 4.5"
                />
                <p className="text-[10px] text-gray-400">Skor ulasan destinasi dari skala 0.0 sampai 5.0.</p>
            </div>
            
            {/* Field Photo Upload */}
            <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Destinasi (Kosongkan jika tidak diubah)</label>
                <label className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                    <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                       <ImagePlus className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col flex-1">
                       <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ganti berkas gambar...</span>
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
              <div className="md:col-span-2 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/20">
                <img
                  src={preview}
                  className="w-full max-h-[300px] object-contain"
                  alt="Preview"
                />
              </div>
            )}

            {/* Field Address */}
            <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Lengkap</label>
                <textarea 
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm resize-none"
                placeholder="Nama jalan, kecamatan, ds..."
                />
            </div>

            {/* Field Google Maps Link */}
            <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    Link Google Maps
                </label>
                <input 
                name="gmaps_url"
                value={formData.gmaps_url || ""}
                onChange={handleChange}
                type="url"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                placeholder="https://maps.google.com/... atau https://goo.gl/maps/..."
                />
            </div>

            {/* Field Description */}
            <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi Singkat</label>
                <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                placeholder="Ceritakan tentang daya tarik lokasi ini..."
                />
            </div>

            </div>
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
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors focus:ring-4 focus:ring-blue-500/20"
          >
            {saving ? (
                <>Memperbarui...</>
            ) : (
                <><Save className="w-4 h-4"/> Simpan Perubahan</>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
