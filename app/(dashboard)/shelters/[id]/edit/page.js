"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useParams } from "next/navigation"
import { shelterService } from "@/services/shelterService"
import { getAdminLocation } from "@/lib/utils/auth"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Save, MapPin as MapPinIcon, ExternalLink, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

const MapPicker = dynamic(() => import("@/components/MapPicker"), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 dark:bg-white/5 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>
})

export default function EditShelterPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "posko_evakuasi",
    address: "",
    phone: "",
    capacity: "",
    notes: "",
    has_medical: false,
    has_kitchen: false,
    has_toilet: false,
    is_24h: true,
    is_active: true,
    volcano_id: "",
    distance_from_volcano: 0,
    lat: null,
    lng: null,
    gmaps_url: ""
  })

  const [volcanoes, setVolcanoes] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch volcanoes
        const { data: vData, error: vError } = await shelterService.getVolcanoes()
        if (vError) throw vError
        
        const adminLocation = getAdminLocation()
        let filtered = vData || []
        
        if (adminLocation) {
          const regionMap = {
            "yogyakarta": "gunung merapi",
            "bali": "gunung agung",
            "lombok": "gunung rinjani"
          }
          const targetName = regionMap[adminLocation.toLowerCase().trim()]
          if (targetName) {
            filtered = filtered.filter(v => v.name.toLowerCase().trim() === targetName)
          }
        }
        setVolcanoes(filtered)

        // Fetch shelter data
        const { data: sData, error: sError } = await shelterService.getById(params.id)
        if (sError) throw sError
        
        // Map DB fields to form state if needed (e.g. location point to lat/lng)
        // Assuming the DB stores lat/lng as separate columns or extracted from POINT
        // Looking at shelterService.js: create uses lat/lng from formData
        // getById returns select("*"). order of lat/lng might need extraction if it's a geometry column
        
        setFormData({
          ...sData,
          capacity: sData.capacity?.toString() || "",
          // If location is POINT, we might need to parse it if getById doesn't return lat/lng
          // But based on services/shelterService.js, create sends 'location' as WKT.
          // Let's assume the columns lat and lng exist since they are in the formData for create.
        })

      } catch (err) {
        console.error(err)
        toast.error("Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleLocationChange = (data) => {
    setFormData(prev => ({
      ...prev,
      address: data.address,
      distance_from_volcano: data.distanceKm,
      lat: data.lat,
      lng: data.lng
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const dataToSave = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0
      }
      
      const { error } = await shelterService.update(params.id, dataToSave)
      
      if (error) throw error

      toast.success("Titik evakuasi berhasil diperbarui")
      router.push("/shelters")
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
        <Link href="/shelters" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Edit Data Evakuasi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Perbarui informasi lokasi operasional di bawah ini.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        
        <div className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Field Name */}
            <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lokasi</label>
                <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                placeholder="Contoh: Barak Pengungsian Glagaharjo"
                />
            </div>
            
            {/* Field Type */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori Tipe</label>
                <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm appearance-none"
                >
                <option value="puskesmas">Puskesmas</option>
                <option value="posko_evakuasi">Posko Evakuasi</option>
                <option value="gor">GOR (Gedung Olahraga)</option>
                <option value="rumah_sakit">Rumah Sakit</option>
                </select>
            </div>

            {/* Field Volcano (Region Selection) */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Lokus Wilayah (Gunung)</span>
                </label>
                <select
                name="volcano_id"
                value={formData.volcano_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm appearance-none"
                >
                <option value="" disabled>Pilih Gunung...</option>
                {volcanoes.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                ))}
                </select>
            </div>

            {/* Field Capacity */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kapasitas Maksimal (Jiwa)</label>
                <input 
                type="number"
                min="0"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                placeholder="0"
                />
            </div>
            
            {/* Field Phone */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kontak Person / Telp</label>
                <input 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                placeholder="0812xxxx / 0274-xxx"
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

            {/* Field Address */}
            <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Lengkap</label>
                <textarea 
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm resize-none"
                placeholder="Alamat lengkap..."
                />
            </div>

            {/* Map Picker Area */}
            <div className="md:col-span-2 space-y-3 py-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-blue-500" />
                        Tentukan Titik Koordinat & Hitung Jarak
                    </label>
                    <div className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 rounded-full border border-blue-100 dark:border-blue-500/20">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                            Jarak ke Gunung: {formData.distance_from_volcano} KM
                        </span>
                    </div>
                </div>
                <MapPicker 
                    selectedVolcanoId={formData.volcano_id} 
                    onLocationChange={handleLocationChange}
                    initialPosition={(formData.lat && formData.lng) ? { lat: formData.lat, lng: formData.lng } : null}
                />
            </div>

            {/* Checkboxes - Facilities */}
            <div className="space-y-3 md:col-span-2 py-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 block">Fasilitas & Layanan</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input type="checkbox" name="has_medical" checked={formData.has_medical} onChange={handleChange} className="peer w-5 h-5 appearance-none rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-colors" />
                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 translate-y-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 select-none group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Pos Medis</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input type="checkbox" name="has_kitchen" checked={formData.has_kitchen} onChange={handleChange} className="peer w-5 h-5 appearance-none rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-colors" />
                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 translate-y-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 select-none group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Dapur Umum</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input type="checkbox" name="has_toilet" checked={formData.has_toilet} onChange={handleChange} className="peer w-5 h-5 appearance-none rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-colors" />
                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 translate-y-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 select-none group-hover:text-gray-900 dark:group-hover:text-white transition-colors">MCK / Sanitasi</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input type="checkbox" name="is_24h" checked={formData.is_24h} onChange={handleChange} className="peer w-5 h-5 appearance-none rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-colors" />
                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 translate-y-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 select-none group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Siaga 24 Jam</span>
                </label>
                </div>
            </div>

            {/* Field Notes */}
            <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Catatan Internal</label>
                <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm resize-none"
                placeholder="Instruksi logistik khusus atau keterangan lain..."
                />
            </div>

            {/* Status Toggle */}
            <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 mt-2">
                <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Status Aktif</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tentukan apakah lokasi ini sedang menerima pengungsi.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
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
