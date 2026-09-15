"use client"

import { useState } from "react"
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  Sliders,
  X,
  Check,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react"
import {
  PRESET_ILLUSTRATIONS,
  ANIMATION_EFFECTS,
  ASPECT_RATIOS,
  detectMediaType,
  parseMediaConfig,
  buildMediaUrl,
} from "@/lib/data/educationIllustrations"
import EducationalMediaViewer from "./EducationalMediaViewer"
import { uploadMedia } from "@/services/uploadService"
import { toast } from "sonner"

export default function WordPressMediaPicker({
  value = "",
  onChange,
  onFileSelect,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("library") // "upload" | "library" | "url" | "effects"

  // Parsed configuration
  const parsed = parseMediaConfig(value)
  const [selectedUrl, setSelectedUrl] = useState(parsed.url || "")
  const [selectedEffect, setSelectedEffect] = useState(parsed.effect || "none")
  const [selectedRatio, setSelectedRatio] = useState(parsed.ratio || "16-9")

  // External URL input
  const [inputUrl, setInputUrl] = useState("")

  // Uploading state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Category filter for library
  const [filterCategory, setFilterCategory] = useState("Semua")

  // React 19 pattern: sync state during render when prop changes without useEffect
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    const config = parseMediaConfig(value)
    setSelectedUrl(config.url || "")
    setSelectedEffect(config.effect || "none")
    setSelectedRatio(config.ratio || "16-9")
  }

  const categories = ["Semua", "Erupsi", "Evakuasi", "Gempa", "Siaga", "Peringatan"]
  const filteredPresets =
    filterCategory === "Semua"
      ? PRESET_ILLUSTRATIONS
      : PRESET_ILLUSTRATIONS.filter((item) => item.category === filterCategory)

  // Handle direct file upload in modal
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 15 * 1024 * 1024 // 15MB
    if (file.size > MAX_SIZE) {
      toast.error("Ukuran file maksimal 15MB")
      return
    }

    try {
      setUploading(true)
      setUploadProgress(30)
      const toastId = toast.loading(`Mengunggah ${file.name}...`)

      // If parent wants to handle deferred file submit
      if (onFileSelect) {
        onFileSelect(file)
      }

      const uploadedUrl = await uploadMedia(file)
      setUploadProgress(100)
      setSelectedUrl(uploadedUrl)
      toast.dismiss(toastId)
      toast.success("Berkas berhasil diunggah!")
      setActiveTab("effects")
    } catch (err) {
      console.error(err)
      toast.error("Gagal mengunggah berkas. Periksa koneksi atau format file.")
    } finally {
      setUploading(false)
    }
  }

  const handleApplyUrl = () => {
    if (!inputUrl.trim()) return
    setSelectedUrl(inputUrl.trim())
    toast.success("Tautan media diterapkan!")
    setActiveTab("effects")
  }

  const handleApplySelection = () => {
    const finalUrl = buildMediaUrl(selectedUrl, selectedEffect, selectedRatio)
    onChange(finalUrl)
    setIsOpen(false)
    toast.success("Ilustrasi animasi berhasil dipilih")
  }

  const handleRemoveMedia = () => {
    setSelectedUrl("")
    setSelectedEffect("none")
    setSelectedRatio("16-9")
    onChange("")
    if (onFileSelect) onFileSelect(null)
  }

  const currentRatioClass =
    ASPECT_RATIOS.find((r) => r.id === selectedRatio)?.className || "aspect-video"

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          Ilustrasi & Animasi Konten Edukasi
        </label>
        {value && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Media Aktif
          </span>
        )}
      </div>

      {/* Main Trigger Card / Preview */}
      {!value ? (
        <div
          onClick={() => {
            setIsOpen(true)
            setActiveTab("library")
          }}
          className="group relative border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 hover:bg-blue-50/40 dark:hover:bg-blue-500/5 bg-white dark:bg-black/20"
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-1">
            Pilih atau Unggah Ilustrasi Animasi
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
            Mendukung gambar JPG/PNG, GIF bergerak, SVG vektor animasi interaktif, Lottie JSON, dan video loop pendek.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
            <Plus className="w-4 h-4" />
            Buka Pustaka Media WordPress
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              SVG ANIMASI
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              GIF BERGERAK
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-300">
              LOTTIE JSON
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
              VIDEO LOOP
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#151522] shadow-sm">
          {/* Active Preview Box */}
          <div className={`w-full ${currentRatioClass} relative bg-gray-950 overflow-hidden group`}>
            <EducationalMediaViewer
              src={value}
              alt="Preview Edukasi"
              showBadge={true}
              objectFit="cover"
            />

            {/* Quick Action Overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true)
                  setActiveTab("effects")
                }}
                className="px-3 py-1.5 bg-black/70 hover:bg-black text-white text-xs font-medium rounded-lg backdrop-blur-md shadow-sm border border-white/10 flex items-center gap-1.5 transition-colors"
                title="Atur Efek Animasi"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Efek & Gerak
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true)
                  setActiveTab("library")
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Ganti Media
              </button>
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors"
                title="Hapus Media"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Info Footer */}
          <div className="p-4 bg-gray-50 dark:bg-black/20 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-white">Format:</span>
              <span className="uppercase font-mono font-bold text-blue-600 dark:text-blue-400">
                {detectMediaType(parsed.url)}
              </span>
              <span className="text-gray-400">•</span>
              <span>Efek: <strong className="text-gray-800 dark:text-white capitalize">{parsed.effect}</strong></span>
              <span className="text-gray-400">•</span>
              <span>Rasio: <strong className="text-gray-800 dark:text-white">{parsed.ratio}</strong></span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(true)
                setActiveTab("library")
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Kelola di Pustaka WordPress →
            </button>
          </div>
        </div>
      )}

      {/* WordPress-Style Media Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161625] w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/70 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Pustaka Media & Studio Animasi WordPress
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pilih animasi siap pakai, unggah berkas gerak, atau sesuaikan efek CSS.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="px-6 border-b border-gray-200 dark:border-white/10 flex items-center gap-1 bg-white dark:bg-[#161625]">
              <button
                type="button"
                onClick={() => setActiveTab("library")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "library"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Pustaka Ilustrasi Bencana
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "upload"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Upload className="w-4 h-4" />
                Unggah Berkas Baru
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "url"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Sisipkan dari URL
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("effects")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "effects"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Sliders className="w-4 h-4" />
                Efek Animasi & Rasio
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-black/20">
              {/* TAB 1: LIBRARY */}
              {activeTab === "library" && (
                <div className="space-y-6">
                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 mr-1">Kategori:</span>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          filterCategory === cat
                            ? "bg-blue-600 text-white font-semibold"
                            : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredPresets.map((preset) => {
                      const isSelected = selectedUrl === preset.url
                      return (
                        <div
                          key={preset.id}
                          onClick={() => setSelectedUrl(preset.url)}
                          className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 group bg-white dark:bg-[#1a1a2e] ${
                            isSelected
                              ? "border-blue-600 ring-4 ring-blue-500/20 shadow-md"
                              : "border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30"
                          }`}
                        >
                          <div className="w-full aspect-video bg-gray-900 overflow-hidden relative">
                            <EducationalMediaViewer
                              src={preset.url}
                              alt={preset.title}
                              showBadge={false}
                              objectFit="cover"
                            />

                            {/* Badge */}
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-emerald-400 border border-emerald-500/30">
                                {preset.badge}
                              </span>
                            </div>

                            {/* Selection check */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          <div className="p-3.5">
                            <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                              {preset.title}
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {preset.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: UPLOAD */}
              {activeTab === "upload" && (
                <div className="max-w-2xl mx-auto py-8">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-12 text-center cursor-pointer transition-colors bg-white dark:bg-[#1a1a2e] group">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                      <Upload className="w-8 h-8" />
                    </div>

                    <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      Pilih berkas dari komputer Anda
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                      Mendukung format: JPG, PNG, WEBP, GIF bergerak, SVG vektor animasi, Lottie JSON (.json), atau video MP4.
                    </p>

                    <span className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors">
                      Jelajahi File
                    </span>

                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm,.json,.svg"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>

                  {uploading && (
                    <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Sedang mengunggah berkas media...</span>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-900/40 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: URL */}
              {activeTab === "url" && (
                <div className="max-w-2xl mx-auto py-8 space-y-6">
                  <div className="bg-white dark:bg-[#1a1a2e] p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-4">
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-500" />
                      Tautan URL Media atau Animasi Eksternal
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Contoh: https://assets2.lottiefiles.com/.../data.json atau https://media.giphy.com/.../giphy.gif"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        Terapkan
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Anda dapat memasukkan tautan langsung file GIF animasi, Lottie JSON URL, video MP4, SVG online, atau CDN gambar edukasi.
                    </p>
                  </div>

                  {/* Sample Suggestions */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-500">Contoh URL yang didukung:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInputUrl("https://assets9.lottiefiles.com/packages/lf20_m9zragkd.json")
                        }}
                        className="px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 rounded-lg text-xs hover:bg-purple-100 transition-colors border border-purple-200 dark:border-purple-500/20"
                      >
                        + Lottie Alert JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputUrl("https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif")
                        }}
                        className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg text-xs hover:bg-amber-100 transition-colors border border-amber-200 dark:border-amber-500/20"
                      >
                        + GIF Animasi Bencana
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: EFFECTS & MOTION SETTINGS */}
              {activeTab === "effects" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Settings */}
                  <div className="lg:col-span-6 space-y-6">
                    {/* Motion Effect Selector */}
                    <div className="bg-white dark:bg-[#1a1a2e] p-5 rounded-xl border border-gray-200 dark:border-white/10 space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        Efek Gerak Tambahan (WordPress Motion)
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Menambahkan animasi dinamis CSS di atas ilustrasi Anda.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {ANIMATION_EFFECTS.map((eff) => (
                          <button
                            key={eff.id}
                            type="button"
                            onClick={() => setSelectedEffect(eff.id)}
                            className={`p-3 rounded-lg text-left text-xs font-medium border transition-all ${
                              selectedEffect === eff.id
                                ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 font-bold"
                                : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div>{eff.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aspect Ratio Selector */}
                    <div className="bg-white dark:bg-[#1a1a2e] p-5 rounded-xl border border-gray-200 dark:border-white/10 space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-500" />
                        Rasio Tampilan Gambar (Aspect Ratio)
                      </label>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {ASPECT_RATIOS.map((ratio) => (
                          <button
                            key={ratio.id}
                            type="button"
                            onClick={() => setSelectedRatio(ratio.id)}
                            className={`p-3 rounded-lg text-left text-xs font-medium border transition-all ${
                              selectedRatio === ratio.id
                                ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 font-bold"
                                : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div>{ratio.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Interactive Preview */}
                  <div className="lg:col-span-6 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Live Preview Pemutar Animasi
                    </label>

                    <div className="rounded-xl overflow-hidden border border-gray-300 dark:border-white/10 bg-gray-950 p-2">
                      <div className={`w-full ${currentRatioClass} rounded-lg overflow-hidden bg-black/40`}>
                        {selectedUrl ? (
                          <EducationalMediaViewer
                            src={selectedUrl}
                            effectOverride={selectedEffect}
                            ratioOverride={selectedRatio}
                            showBadge={true}
                            objectFit="cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-xs">
                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                            <span>Pilih media terlebih dahulu di tab Pustaka atau Unggah</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Animasi akan langsung diputar otomatis di aplikasi web & mobile pengguna saat konten edukasi dibuka.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#161625]">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {selectedUrl ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Media terpilih ({detectMediaType(selectedUrl).toUpperCase()})</span>
                  </>
                ) : (
                  <span>Belum ada media yang dipilih</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!selectedUrl}
                  onClick={handleApplySelection}
                  className="px-6 py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Gunakan Ilustrasi Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
