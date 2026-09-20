"use client"

import { useEffect, useState } from "react"
import { trackingService } from "@/services/trackingService"
import TrackingMap from "@/components/tracking/TrackingMap"
import { Loader2, Navigation, Clock, Activity, AlertCircle, RefreshCw, MapPin } from "lucide-react"

export default function TrackingPage() {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [trackPoints, setTrackPoints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load active sessions
  const loadSessions = async (hideLoader = false) => {
    if (!hideLoader) setIsLoading(true)
    setIsRefreshing(true)
    
    const { data, error } = await trackingService.getActiveSessions()
    
    if (!error && data) {
      setSessions(data)
      // Auto select first session if none selected
      if (data.length > 0 && !selectedSession) {
        handleSelectSession(data[0])
      } else if (data.length === 0) {
        setSelectedSession(null)
        setTrackPoints([])
      }
    }
    
    setIsLoading(false)
    setIsRefreshing(false)
  }

  // Load track points for a specific session
  const handleSelectSession = async (session) => {
    setSelectedSession(session)
    const { data, error } = await trackingService.getSessionTrack(session.id)
    if (!error && data) {
      setTrackPoints(data)
    }
  }

  useEffect(() => {
    loadSessions()
    
    // Polling every 30 seconds for live update (Opsional)
    const interval = setInterval(() => {
      loadSessions(true)
      if (selectedSession) {
        handleSelectSession(selectedSession)
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-600" />
            Tracking Pendaki Aktif
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitoring rute pendakian secara real-time</p>
        </div>
        <button 
          onClick={() => loadSessions()}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Sidebar List Pendaki */}
        <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              Sesi Aktif ({sessions.length})
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading && !isRefreshing ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">Memuat sesi...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Tidak ada pendaki aktif</p>
                <p className="text-xs text-gray-500 mt-1">Belum ada sesi pendakian yang sedang berjalan saat ini.</p>
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedSession?.id === session.id
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 ring-1 ring-blue-500"
                      : "bg-white border-gray-100 dark:bg-black/10 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/20 hover:shadow-sm"
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {session.username || `Pendaki ID: ${session.user_id.substring(0, 8)}...`}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" />
                      {session.distance_km?.toFixed(2) || 0} km
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm relative min-h-[400px]">
          {selectedSession ? (
            <TrackingMap selectedSession={selectedSession} trackPoints={trackPoints} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-black/20">
              <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Pilih sesi pendakian untuk melihat rute di peta</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
