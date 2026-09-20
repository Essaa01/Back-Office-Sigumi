"use client"

import dynamic from "next/dynamic"

// Dynamically import map client to prevent SSR issues with Leaflet
const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500">Memuat Peta...</p>
      </div>
    </div>
  ),
})

export default function TrackingMap({ selectedSession, trackPoints }) {
  return (
    <div className="w-full h-full relative z-0">
      <MapClient selectedSession={selectedSession} trackPoints={trackPoints} />
    </div>
  )
}
