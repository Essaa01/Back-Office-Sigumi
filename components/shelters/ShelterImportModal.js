"use client"

import { useState, useEffect, useRef } from "react"
import * as XLSX from "xlsx"
import { getDistance } from "geolib"
import { shelterService } from "@/services/shelterService"
import { getAdminLocation } from "@/lib/utils/auth"
import { toast } from "sonner"
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building,
  Info
} from "lucide-react"

const VOLCANO_COORDS = {
  "a1b2c3d4-e5f6-7890-abcd-111111111111": { lat: -7.5407, lng: 110.4463 }, // Merapi
  "a1b2c3d4-e5f6-7890-abcd-222222222222": { lat: -8.342, lng: 115.508 },  // Agung
  "a1b2c3d4-e5f6-7890-abcd-333333333333": { lat: -8.411, lng: 116.457 },  // Rinjani
}

const parseBoolean = (val, defaultVal = false) => {
  if (val === undefined || val === null || val === "") return defaultVal
  const str = String(val).toLowerCase().trim()
  return str === "ya" || str === "yes" || str === "1" || str === "true" || str === "y"
}

const normalizeType = (rawType) => {
  if (!rawType) return "posko_evakuasi"
  const val = String(rawType).toLowerCase().trim().replace(/\s+/g, "_")
  if (val.includes("puskesmas")) return "puskesmas"
  if (val.includes("gor") || val.includes("gedung")) return "gor"
  if (val.includes("rumah_sakit") || val.includes("rs")) return "rumah_sakit"
  return "posko_evakuasi"
}

export default function ShelterImportModal({ isOpen, onClose, onSuccess }) {
  const [volcanoes, setVolcanoes] = useState([])
  const [selectedVolcanoId, setSelectedVolcanoId] = useState("")
  const [file, setFile] = useState(null)
  const [parsedRows, setParsedRows] = useState([])
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const handleClose = () => {
    setFile(null)
    setParsedRows([])
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return

    const fetchVolcanoes = async () => {
      try {
        const { data, error } = await shelterService.getVolcanoes()
        if (error) throw error

        const adminLocation = getAdminLocation()
        let filtered = data || []

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
        if (filtered.length > 0) {
          setSelectedVolcanoId(filtered[0].id)
        }
      } catch (err) {
        console.error(err)
        toast.error("Gagal memuat data gunung")
      }
    }

    fetchVolcanoes()
  }, [isOpen])

  if (!isOpen) return null

  const handleDownloadTemplate = (format = "csv") => {
    const templateData = [
      {
        nama_lokasi: "Barak Pengungsian Glagaharjo",
        tipe: "posko_evakuasi",
        alamat: "Jl. Bebeng, Glagaharjo, Cangkringan, Sleman",
        latitude: -7.5841,
        longitude: 110.4572,
        kapasitas: 500,
        telepon: "081234567890",
        medis: "ya",
        dapur: "ya",
        toilet: "ya",
        layanan_24_jam: "ya",
        catatan: "Dekat dengan akses jalan evakuasi utama",
        gmaps_url: "https://maps.google.com/?q=-7.5841,110.4572"
      },
      {
        nama_lokasi: "Puskesmas Cangkringan",
        tipe: "puskesmas",
        alamat: "Kecamatan Cangkringan, Sleman",
        latitude: -7.6385,
        longitude: 110.4528,
        kapasitas: 100,
        telepon: "0274-895123",
        medis: "ya",
        dapur: "tidak",
        toilet: "ya",
        layanan_24_jam: "ya",
        catatan: "Fasilitas IGD 24 jam",
        gmaps_url: ""
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Evakuasi")

    if (format === "xlsx") {
      XLSX.writeFile(workbook, "template_titik_evakuasi.xlsx")
    } else {
      XLSX.writeFile(workbook, "template_titik_evakuasi.csv")
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const parseFile = (uploadFile) => {
    setIsParsing(true)
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const buffer = evt.target.result
        const workbook = XLSX.read(buffer, { type: "array" })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

        if (!rawJson || rawJson.length === 0) {
          toast.error("File tidak berisi data atau format kosong")
          setParsedRows([])
          setIsParsing(false)
          return
        }

        const normalizedRows = rawJson.map((row, index) => {
          // Normalize keys to lowercase and stripped spaces
          const cleanRow = {}
          for (const key of Object.keys(row)) {
            cleanRow[key.toLowerCase().trim().replace(/[\s_-]+/g, "_")] = row[key]
          }

          const name = cleanRow.nama_lokasi || cleanRow.nama || cleanRow.name || cleanRow.shelter_name || ""
          const rawType = cleanRow.tipe || cleanRow.type || cleanRow.kategori || "posko_evakuasi"
          const address = cleanRow.alamat || cleanRow.address || cleanRow.lokasi || ""

          const rawLat = cleanRow.latitude || cleanRow.lat || cleanRow.lintang
          const rawLng = cleanRow.longitude || cleanRow.lng || cleanRow.lon || cleanRow.bujur

          const lat = rawLat !== "" && !isNaN(parseFloat(rawLat)) ? parseFloat(rawLat) : null
          const lng = rawLng !== "" && !isNaN(parseFloat(rawLng)) ? parseFloat(rawLng) : null

          const capacity = parseInt(cleanRow.kapasitas || cleanRow.capacity || cleanRow.daya_tampung, 10) || 0
          const phone = cleanRow.telepon || cleanRow.phone || cleanRow.telp || cleanRow.kontak || ""
          const notes = cleanRow.catatan || cleanRow.notes || cleanRow.keterangan || ""

          const has_medical = parseBoolean(cleanRow.medis || cleanRow.has_medical || cleanRow.fasilitas_medis, false)
          const has_kitchen = parseBoolean(cleanRow.dapur || cleanRow.has_kitchen || cleanRow.dapur_umum, false)
          const has_toilet = parseBoolean(cleanRow.toilet || cleanRow.has_toilet, false)
          const is_24h = parseBoolean(cleanRow.layanan_24_jam || cleanRow.layanan_24h || cleanRow.is_24h || cleanRow["24_jam"], true)
          const is_active = parseBoolean(cleanRow.aktif || cleanRow.is_active, true)

          let gmaps_url = cleanRow.gmaps_url || cleanRow.link_maps || cleanRow.google_maps || ""
          if (!gmaps_url && lat !== null && lng !== null) {
            gmaps_url = `https://www.google.com/maps?q=${lat},${lng}`
          }

          let distance_from_volcano = 0
          if (lat !== null && lng !== null && VOLCANO_COORDS[selectedVolcanoId]) {
            const vCoord = VOLCANO_COORDS[selectedVolcanoId]
            const distMeters = getDistance(
              { latitude: lat, longitude: lng },
              { latitude: vCoord.lat, longitude: vCoord.lng }
            )
            distance_from_volcano = parseFloat((distMeters / 1000).toFixed(2))
          }

          const isValid = !!name && lat !== null && lng !== null
          const errorMsg = !name
            ? "Nama lokasi kosong"
            : lat === null || lng === null
            ? "Koordinat lat/lng tidak valid"
            : null

          return {
            rowIdx: index + 2, // header is row 1
            name,
            type: normalizeType(rawType),
            address,
            lat,
            lng,
            capacity,
            phone,
            notes,
            has_medical,
            has_kitchen,
            has_toilet,
            is_24h,
            is_active,
            gmaps_url,
            volcano_id: selectedVolcanoId,
            distance_from_volcano,
            isValid,
            errorMsg
          }
        })

        setParsedRows(normalizedRows)
      } catch (err) {
        console.error("Error parsing file:", err)
        toast.error("Gagal membaca file. Pastikan format CSV atau Excel valid.")
      } finally {
        setIsParsing(false)
      }
    }

    reader.readAsArrayBuffer(uploadFile)
  }

  const validRows = parsedRows.filter((r) => r.isValid)
  const invalidRowsCount = parsedRows.length - validRows.length

  const handleImportSubmit = async () => {
    if (validRows.length === 0) {
      toast.error("Tidak ada data valid yang dapat diimpor")
      return
    }

    if (!selectedVolcanoId) {
      toast.error("Silakan pilih gunung terlebih dahulu")
      return
    }

    try {
      setIsSubmitting(true)
      const toastId = toast.loading(`Mengimpor ${validRows.length} titik evakuasi...`)

      // Re-assign selected volcano id & recalculate distance before inserting
      const itemsToSave = validRows.map((item) => {
        let dist = item.distance_from_volcano
        if (item.lat && item.lng && VOLCANO_COORDS[selectedVolcanoId]) {
          const vCoord = VOLCANO_COORDS[selectedVolcanoId]
          const distMeters = getDistance(
            { latitude: item.lat, longitude: item.lng },
            { latitude: vCoord.lat, longitude: vCoord.lng }
          )
          dist = parseFloat((distMeters / 1000).toFixed(2))
        }

        const shelterData = { ...item }
        delete shelterData.rowIdx
        delete shelterData.isValid
        delete shelterData.errorMsg

        return {
          ...shelterData,
          volcano_id: selectedVolcanoId,
          distance_from_volcano: dist
        }
      })

      const { error } = await shelterService.createBatch(itemsToSave)
      toast.dismiss(toastId)

      if (error) throw error

      toast.success(`Berhasil mengimpor ${validRows.length} titik evakuasi!`)
      if (onSuccess) onSuccess()
      handleClose()
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Gagal mengimpor data ke server")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Upload Titik Evakuasi (CSV / Excel)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Impor banyak data lokasi posko dan tempat evakuasi sekaligus
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Options: Template Download & Volcano Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Pilih Target Gunung
              </label>
              <select
                value={selectedVolcanoId}
                onChange={(e) => setSelectedVolcanoId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                {volcanoes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                Lokasi akan otomatis dihitung jaraknya ke gunung ini.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Unduh Format Contoh
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("csv")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  Format .CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("xlsx")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  Format .Excel
                </button>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                Gunakan file ini sebagai template pengisian data.
              </span>
            </div>
          </div>

          {/* File Upload Box */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-white/[0.02]"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {file ? file.name : "Klik atau seret file CSV / Excel ke sini"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format didukung: .csv, .xlsx, .xls (maksimal 500 baris)
              </p>
            </div>
          </div>

          {/* Loading Indicator */}
          {isParsing && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Memproses dan memvalidasi isi file...
            </div>
          )}

          {/* Data Preview Table */}
          {!isParsing && parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Pratinjau Data ({parsedRows.length} baris)
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {validRows.length} valid
                  </span>
                  {invalidRowsCount > 0 && (
                    <span className="flex items-center gap-1 text-red-500 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {invalidRowsCount} perlu dicek
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">No</th>
                      <th className="px-3 py-2">Nama Lokasi</th>
                      <th className="px-3 py-2">Tipe</th>
                      <th className="px-3 py-2">Koordinat</th>
                      <th className="px-3 py-2">Kapasitas</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {parsedRows.map((r, i) => (
                      <tr
                        key={i}
                        className={
                          r.isValid
                            ? "hover:bg-gray-50 dark:hover:bg-white/5"
                            : "bg-red-50/50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                        }
                      >
                        <td className="px-3 py-2 text-center font-mono">{r.rowIdx}</td>
                        <td className="px-3 py-2 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            <span className="truncate max-w-[180px]">{r.name || "(Kosong)"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 capitalize">{r.type.replace(/_/g, " ")}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">
                          {r.lat !== null && r.lng !== null
                            ? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`
                            : "Invalid"}
                        </td>
                        <td className="px-3 py-2">{r.capacity} orang</td>
                        <td className="px-3 py-2 text-right">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Siap
                            </span>
                          ) : (
                            <span
                              title={r.errorMsg}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded-full"
                            >
                              <AlertCircle className="w-3 h-3" /> {r.errorMsg}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Baris dengan status tidak valid akan otomatis dilewati saat impor.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={isSubmitting || validRows.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Impor {validRows.length} Lokasi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
