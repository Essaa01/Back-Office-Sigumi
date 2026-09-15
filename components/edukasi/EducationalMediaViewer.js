/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from "react"
import { detectMediaType, parseMediaConfig, ANIMATION_EFFECTS } from "@/lib/data/educationIllustrations"
import { Play, Sparkles, Film, Image as ImageIcon } from "lucide-react"

export default function EducationalMediaViewer({
  src,
  alt = "Ilustrasi Edukasi",
  className = "",
  effectOverride,
  showBadge = false,
  objectFit = "cover",
}) {
  const [lottieLoaded, setLottieLoaded] = useState(
    () => typeof window !== "undefined" && !!window.customElements?.get("lottie-player")
  )
  const [hasError, setHasError] = useState(false)

  const config = parseMediaConfig(src)
  const mediaUrl = config.url
  const activeEffect = effectOverride || config.effect || "none"
  const mediaType = detectMediaType(mediaUrl)

  // Dynamically load lottie-player web component if Lottie format is detected
  useEffect(() => {
    if (
      mediaType === "lottie" &&
      typeof window !== "undefined" &&
      !window.customElements?.get("lottie-player")
    ) {
      const script = document.createElement("script")
      script.src = "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"
      script.async = true
      script.onload = () => setLottieLoaded(true)
      document.body.appendChild(script)
    }
  }, [mediaType])

  if (!mediaUrl) {
    return null
  }

  const effectClass = ANIMATION_EFFECTS.find((e) => e.id === activeEffect)?.className || ""
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover"

  const badgeLabels = {
    lottie: { text: "LOTTIE", bg: "bg-purple-600/90 text-white" },
    video: { text: "VIDEO LOOP", bg: "bg-blue-600/90 text-white" },
    svg: { text: "SVG ANIMASI", bg: "bg-emerald-600/90 text-white" },
    gif: { text: "GIF ANIMASI", bg: "bg-amber-600/90 text-white" },
    image: { text: "GAMBAR", bg: "bg-gray-800/80 text-white" },
  }

  return (
    <div className={`relative overflow-hidden w-full h-full flex items-center justify-center bg-gray-900/5 dark:bg-black/20 ${className}`}>
      {/* Media Rendering */}
      {mediaType === "video" ? (
        <video
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className={`w-full h-full ${fitClass} ${effectClass}`}
          onError={() => setHasError(true)}
        />
      ) : mediaType === "lottie" ? (
        <div className={`w-full h-full flex items-center justify-center ${effectClass}`}>
          {lottieLoaded ? (
            <lottie-player
              src={mediaUrl}
              background="transparent"
              speed="1"
              style={{ width: "100%", height: "100%" }}
              loop
              autoplay
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-6 text-xs text-gray-500">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span>Memuat animasi Lottie...</span>
            </div>
          )}
        </div>
      ) : (
        <img
          src={mediaUrl}
          alt={alt}
          className={`w-full h-full ${fitClass} ${effectClass}`}
          onError={() => setHasError(true)}
        />
      )}

      {/* Format Badge Indicator */}
      {showBadge && badgeLabels[mediaType] && (
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm border border-white/20 bg-black/60 text-white">
          {mediaType === "video" && <Film className="w-3 h-3 text-blue-400" />}
          {mediaType === "lottie" && <Sparkles className="w-3 h-3 text-purple-400" />}
          {mediaType === "svg" && <Sparkles className="w-3 h-3 text-emerald-400" />}
          {mediaType === "gif" && <Play className="w-3 h-3 text-amber-400" />}
          {mediaType === "image" && <ImageIcon className="w-3 h-3 text-gray-400" />}
          <span>{badgeLabels[mediaType].text}</span>
          {activeEffect !== "none" && (
            <span className="text-amber-300 font-normal">({activeEffect})</span>
          )}
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-xs text-red-500 font-medium">
          Gagal memuat media animasi
        </div>
      )}
    </div>
  )
}
