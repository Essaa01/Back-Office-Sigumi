"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { trackingService } from "@/services/trackingService"
import { sosService } from "@/services/sosService"
import TrackingMap from "@/components/tracking/TrackingMap"
import { getAdminRole } from "@/lib/utils/auth"
import {
  deduplicateAlerts,
  getLocationAge,
  findNearestVolcano,
  formatCoordinates,
  canAdminManageSos,
  formatLocalTime,
  formatFullDateTime,
  SOS_STATUS_CONFIG,
} from "@/lib/utils/sos"
import { toast } from "sonner"
import {
  Loader2,
  Navigation,
  Clock,
  Activity,
  AlertCircle,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Eye,
  ExternalLink,
  X,
  Phone,
  User,
  ShieldAlert,
  Calendar,
} from "lucide-react"

export default function TrackingPage() {
  // Navigation / Sessions State
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [trackPoints, setTrackPoints] = useState([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // SOS Emergency Alerts State
  const [sosAlerts, setSosAlerts] = useState([])
  const [selectedSosAlert, setSelectedSosAlert] = useState(null)
  const [isLoadingSos, setIsLoadingSos] = useState(true)
  const [sosFilter, setSosFilter] = useState("all") // 'all', 'open', 'acknowledged', 'resolved', 'cancelled'
  const [activeTab, setActiveTab] = useState("sos") // 'sos' | 'sessions'
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isTableMissing, setIsTableMissing] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTING") // 'SUBSCRIBED' | 'CONNECTING' | 'DISCONNECTED'
  const [adminRole] = useState(() => getAdminRole())

  // Ticking time state (every 5 seconds) so relative time displays update live on screen
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Keep a ref to current selectedSosAlert and selectedSession for interval updates
  const selectedSessionRef = useRef(selectedSession)
  const selectedSosAlertRef = useRef(selectedSosAlert)

  useEffect(() => {
    selectedSessionRef.current = selectedSession
    selectedSosAlertRef.current = selectedSosAlert
  }, [selectedSession, selectedSosAlert])

  // Load track points for a specific session
  const handleSelectSession = useCallback(async (session) => {
    setSelectedSession(session)
    if (!session) {
      setTrackPoints([])
      return
    }
    try {
      const { data, error } = await trackingService.getSessionTrack(session.id)
      if (!error && data) {
        setTrackPoints(data)
      } else {
        setTrackPoints([])
      }
    } catch (err) {
      console.error("Error loading track points:", err)
      setTrackPoints([])
    }
  }, [])

  // Load active hiking sessions
  const loadSessions = useCallback(async (hideLoader = false) => {
    if (!hideLoader) setIsLoadingSessions(true)
    try {
      const { data, error } = await trackingService.getActiveSessions()
      if (!error && data) {
        setSessions(data)
        // Auto select first session only if no session and no SOS is selected
        if (data.length > 0 && !selectedSessionRef.current && !selectedSosAlertRef.current) {
          handleSelectSession(data[0])
        }
      }
    } catch (err) {
      console.error("Error loading sessions:", err)
    } finally {
      setIsLoadingSessions(false)
    }
  }, [handleSelectSession])

  // Load hiking SOS alerts (Initial & Reconnect Fetch)
  const loadSosAlerts = useCallback(async (hideLoader = false) => {
    if (!hideLoader) setIsLoadingSos(true)
    try {
      const { data, error, tableMissing } = await sosService.getAll()
      if (tableMissing) {
        setIsTableMissing(true)
        setSosAlerts([])
        return
      }

      setIsTableMissing(false)
      if (!error && data) {
        setSosAlerts((prev) => deduplicateAlerts(prev, data))

        // If open alerts exist and user hasn't chosen a tab, default to SOS tab
        const hasOpen = data.some((a) => a.status === "open" || a.status === "acknowledged")
        if (hasOpen && !selectedSessionRef.current) {
          setActiveTab("sos")
        }
      }
    } catch (err) {
      console.error("Error loading SOS alerts:", err)
    } finally {
      setIsLoadingSos(false)
    }
  }, [])

  // Select an SOS Alert
  const handleSelectSosAlert = useCallback(
    async (sos) => {
      setSelectedSosAlert(sos)
      // If linked to a session, load session and its track points
      if (sos.session_id) {
        const foundSession = sessions.find((s) => s.id === sos.session_id)
        if (foundSession) {
          setSelectedSession(foundSession)
        } else {
          // Fallback: create placeholder session
          setSelectedSession({
            id: sos.session_id,
            user_id: sos.user_id,
            username: sos.profile?.full_name || "Pendaki",
            distance_km: sos.session?.distance_km || 0,
            started_at: sos.session?.started_at || sos.created_at,
          })
        }
        // Load track points
        try {
          const { data } = await trackingService.getSessionTrack(sos.session_id)
          setTrackPoints(data || [])
        } catch {
          setTrackPoints([])
        }
      } else {
        // No session associated; still center on the SOS marker
        setSelectedSession(null)
        setTrackPoints([])
      }
    },
    [sessions]
  )

  // Update SOS status (open -> acknowledged -> resolved)
  const handleUpdateStatus = async (alertId, newStatus) => {
    if (!canAdminManageSos(adminRole)) {
      toast.error("Akses Ditolak: Hanya BPBD dan MDMC yang memiliki otorisasi penanganan SOS.")
      return
    }

    const toastId = toast.loading("Memperbarui status penanganan...")
    try {
      const { data, error } = await sosService.updateStatus(alertId, newStatus, adminRole)
      toast.dismiss(toastId)

      if (error) {
        toast.error(error.message || "Gagal memperbarui status SOS.")
        return
      }

      // Optimistic merge in state
      setSosAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, ...data } : a))
      )

      if (selectedSosAlert?.id === alertId) {
        setSelectedSosAlert((prev) => ({ ...prev, ...data }))
      }

      const statusName =
        newStatus === "acknowledged"
          ? "Sedang Ditangani"
          : newStatus === "resolved"
          ? "Selesai (Rescued)"
          : "Dibatalkan"

      toast.success(`Status SOS berhasil diubah: ${statusName}`)
    } catch (err) {
      toast.dismiss(toastId)
      toast.error("Terjadi kesalahan saat memperbarui status.")
      console.error(err)
    }
  }

  // Real-time track point streaming for selected session
  useEffect(() => {
    if (!selectedSession?.id) return

    const unsubscribe = trackingService.subscribeToSessionTrack(
      selectedSession.id,
      (newPoint) => {
        setTrackPoints((prev) => {
          if (
            prev.some(
              (p) =>
                p.id === newPoint.id ||
                (p.latitude === newPoint.latitude &&
                  p.longitude === newPoint.longitude &&
                  p.recorded_at === newPoint.recorded_at)
            )
          ) {
            return prev
          }
          return [...prev, newPoint]
        })

        // Update session's last_point_at timestamp
        if (newPoint.recorded_at) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === selectedSession.id
                ? { ...s, last_point_at: newPoint.recorded_at }
                : s
            )
          )
          setSelectedSession((prev) =>
            prev && prev.id === selectedSession.id
              ? { ...prev, last_point_at: newPoint.recorded_at }
              : prev
          )
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [selectedSession?.id])

  // Initial Load & Realtime Subscription
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions()
    loadSosAlerts()

    // Setup Supabase Realtime Subscription
    const unsubscribe = sosService.subscribeToAlerts({
      onInsert: (newAlert) => {
        toast.error(
          `🚨 SINYAL SOS BARU DITERIMA!\nPendaki: ${
            newAlert.profile?.full_name || "Pendaki"
          }\nPesan: "${newAlert.message}"`,
          { duration: 8000 }
        )

        // Deduplicate into state
        setSosAlerts((prev) => deduplicateAlerts(prev, newAlert))
        setActiveTab("sos")
      },
      onUpdate: (updatedAlert) => {
        setSosAlerts((prev) => deduplicateAlerts(prev, updatedAlert))
        if (selectedSosAlertRef.current?.id === updatedAlert.id) {
          setSelectedSosAlert((prev) => ({ ...prev, ...updatedAlert }))
        }
      },
      onDelete: (deletedAlert) => {
        setSosAlerts((prev) => prev.filter((a) => a.id !== deletedAlert.id))
      },
      onStatusChange: (status, err) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("SUBSCRIBED")
          // On reconnect / initial subscribe, fetch fresh data to catch missed events
          loadSosAlerts(true)
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("DISCONNECTED")
          console.warn("Realtime SOS channel issue:", status, err)
        } else {
          setRealtimeStatus("CONNECTING")
        }
      },
    })

    // Polling interval (every 30 seconds) for sessions and fallback for SOS
    const interval = setInterval(() => {
      loadSessions(true)
      loadSosAlerts(true)
      if (selectedSessionRef.current) {
        handleSelectSession(selectedSessionRef.current)
      }
    }, 30000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [loadSessions, loadSosAlerts, handleSelectSession])

  // Manual refresh all
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([loadSessions(true), loadSosAlerts(true)])
    if (selectedSession) {
      handleSelectSession(selectedSession)
    }
    setIsRefreshing(false)
    toast.success("Data berhasil diperbarui")
  }

  // Count active SOS alerts
  const openSosCount = useMemo(() => {
    return sosAlerts.filter((a) => a.status === "open").length
  }, [sosAlerts])

  const acknowledgedSosCount = useMemo(() => {
    return sosAlerts.filter((a) => a.status === "acknowledged").length
  }, [sosAlerts])

  const totalActionableSos = openSosCount + acknowledgedSosCount

  // Filtered SOS alerts list
  const filteredSosAlerts = useMemo(() => {
    if (sosFilter === "all") return sosAlerts
    return sosAlerts.filter((a) => a.status === sosFilter)
  }, [sosAlerts, sosFilter])

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto font-sans">
      {/* Emergency Alert Banner (visible when open SOS alerts exist) */}
      {openSosCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                🚨 PERINGATAN DARURAT: {openSosCount} Sinyal SOS Menunggu Penanganan!
              </h2>
              <p className="text-xs text-red-100 mt-0.5">
                Segera lakukan konfirmasi dan koordinasi dengan tim evakuasi SAR lapangan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab("sos")
              setSosFilter("open")
            }}
            className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 active:scale-[0.98] font-bold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            Tampilkan Sinyal Terbuka ({openSosCount})
          </button>
        </div>
      )}

      {/* Migration Notice Banner if table missing */}
      {isTableMissing && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <b>Pemberitahuan Migrasi:</b> Tabel <code>public.hiking_sos_alerts</code> belum diterapkan di database Supabase target.
              Jalankan file migrasi <code>database/20261027_hiking_sos_and_idempotent_points.sql</code> di Supabase SQL Editor.
            </span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Navigation className="w-6 h-6 text-blue-600" />
            Tracking Pendaki & Respons SOS
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring jalur pendakian dan sistem tanggap darurat SAR real-time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Realtime Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 shadow-sm">
            <Radio
              className={`w-3.5 h-3.5 ${
                realtimeStatus === "SUBSCRIBED"
                  ? "text-emerald-500 animate-pulse"
                  : realtimeStatus === "CONNECTING"
                  ? "text-amber-500"
                  : "text-gray-400"
              }`}
            />
            <span className="font-medium">
              {realtimeStatus === "SUBSCRIBED"
                ? "Realtime Aktif"
                : realtimeStatus === "CONNECTING"
                ? "Menghubungkan..."
                : "Polling Otomatis"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm text-sm font-medium cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar List + Map Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left Column: Sidebar with Tab System */}
        <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          {/* Tabs Navigation */}
          <div className="grid grid-cols-2 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("sos")}
              className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer ${
                activeTab === "sos"
                  ? "border-red-600 text-red-600 bg-white dark:bg-[#1a1a2e]"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Sinyal SOS</span>
              {totalActionableSos > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                  {totalActionableSos}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sessions")}
              className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer ${
                activeTab === "sessions"
                  ? "border-blue-600 text-blue-600 bg-white dark:bg-[#1a1a2e]"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Sesi Aktif</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                {sessions.length}
              </span>
            </button>
          </div>

          {/* TAB 1: SOS ALERTS LIST */}
          {activeTab === "sos" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Filter Chips */}
              <div className="p-2.5 border-b border-gray-100 dark:border-white/5 flex gap-1.5 overflow-x-auto text-[11px]">
                {[
                  { id: "all", label: "Semua" },
                  { id: "open", label: "Open", count: openSosCount },
                  { id: "acknowledged", label: "Ditangani", count: acknowledgedSosCount },
                  { id: "resolved", label: "Selesai" },
                  { id: "cancelled", label: "Batal" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSosFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      sosFilter === f.id
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {f.label}
                    {f.count !== undefined && f.count > 0 && ` (${f.count})`}
                  </button>
                ))}
              </div>

              {/* Alert Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {isLoadingSos ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                    <p className="text-xs">Memuat sinyal SOS...</p>
                  </div>
                ) : filteredSosAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {sosFilter === "all" ? "Tidak ada sinyal SOS aktif" : `Tidak ada alert berstatus "${sosFilter}"`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Kondisi jalur pendakian saat ini dalam situasi aman.
                    </p>
                  </div>
                ) : (
                  filteredSosAlerts.map((sos) => {
                    const isSelected = selectedSosAlert?.id === sos.id
                    const statusCfg = SOS_STATUS_CONFIG[sos.status] || SOS_STATUS_CONFIG.open
                    const locationAge = getLocationAge(sos.location_recorded_at, sos.created_at, now)
                    const volcano = findNearestVolcano(sos.latitude, sos.longitude)

                    return (
                      <div
                        key={sos.id || sos.client_alert_id}
                        onClick={() => handleSelectSosAlert(sos)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-red-50/60 dark:bg-red-500/10 border-red-300 dark:border-red-500/40 ring-2 ring-red-500/30"
                            : "bg-white dark:bg-black/10 border-gray-100 dark:border-white/5 hover:border-red-200 dark:hover:border-red-500/20"
                        }`}
                      >
                        {/* Header: Name & Status */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${statusCfg.dotClass}`} />
                            <span className="font-bold text-xs text-gray-900 dark:text-white truncate max-w-[150px]">
                              {sos.profile?.full_name || `Pendaki (${sos.user_id.slice(0, 8)})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {locationAge.isRealtime && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-time
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusCfg.badgeClass}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>

                        {/* Emergency Message */}
                        <p className="text-xs text-red-900 dark:text-red-300 font-medium line-clamp-2 mb-2 bg-red-50/50 dark:bg-red-500/5 p-1.5 rounded-lg border border-red-100 dark:border-red-500/10">
                          &ldquo;{sos.message}&rdquo;
                        </p>

                        {/* Mountain & Location Age */}
                        <div className="flex flex-col gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          {volcano && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                              <span>
                                {volcano.name} ({volcano.distanceKm} km)
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gray-100 dark:border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-500 font-medium">
                                🕒 HP: <span className="font-semibold text-gray-800 dark:text-gray-200">{locationAge.exactTime}</span>
                              </span>
                              {locationAge.isRealtime ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                                  Real-time ({locationAge.ageText})
                                </span>
                              ) : locationAge.isStale ? (
                                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                  ⚠️ {locationAge.ageText}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  🕒 {locationAge.ageText}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectSosAlert(sos)
                                setIsDetailModalOpen(true)
                              }}
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" /> Detail
                            </button>
                          </div>
                        </div>

                        {/* Quick Action Button for Status */}
                        {statusCfg.nextStatus && (
                          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUpdateStatus(sos.id, statusCfg.nextStatus)
                              }}
                              className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                              {statusCfg.actionLabel}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE SESSIONS LIST (Preserved Original) */}
          {activeTab === "sessions" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoadingSessions ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <p className="text-xs text-gray-500">Memuat sesi pendakian...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Tidak ada pendaki aktif</p>
                  <p className="text-xs text-gray-500 mt-1">Belum ada sesi pendakian yang sedang berjalan saat ini.</p>
                </div>
              ) : (
                sessions.map((session) => {
                  const sessionAge = session.last_point_at
                    ? getLocationAge(session.last_point_at, session.started_at, now)
                    : null

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        setSelectedSosAlert(null)
                        handleSelectSession(session)
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedSession?.id === session.id && !selectedSosAlert
                          ? "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 ring-1 ring-blue-500"
                          : "bg-white border-gray-100 dark:bg-black/10 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                          {session.username || `Pendaki ID: ${session.user_id.substring(0, 8)}...`}
                        </div>
                        {sessionAge && (
                          sessionAge.isRealtime ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-time
                            </span>
                          ) : sessionAge.isStale ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800">
                              ⚠️ Usang
                            </span>
                          ) : null
                        )}
                      </div>

                      <div className="space-y-1 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            <span>Mulai: {formatLocalTime(session.started_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{session.distance_km?.toFixed(2) || 0} km</span>
                          </div>
                        </div>

                        {session.last_point_at && sessionAge && (
                          <div className="text-[10px] text-gray-600 dark:text-gray-300 flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5">
                            <span>GPS HP: <b>{sessionAge.exactTime}</b></span>
                            <span className={sessionAge.isRealtime ? "text-emerald-600 font-semibold" : sessionAge.isStale ? "text-amber-700 font-semibold" : ""}>
                              {sessionAge.ageText}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Right Column: Map Area */}
        <div className="flex-1 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm relative min-h-[460px]">
          <TrackingMap
            selectedSession={selectedSession}
            trackPoints={trackPoints}
            sosAlerts={sosAlerts}
            selectedSosAlert={selectedSosAlert}
            now={now}
            onSelectSosAlert={(sos) => {
              handleSelectSosAlert(sos)
              setActiveTab("sos")
            }}
            onUpdateSosStatus={handleUpdateStatus}
          />
        </div>
      </div>

      {/* Detail SOS Modal / Drawer */}
      {isDetailModalOpen && selectedSosAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-red-50/50 dark:bg-red-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-red-600/30">
                  SOS
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Detail Panggilan Darurat
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ID Alert: <span className="font-mono">{selectedSosAlert.id}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
              {/* Emergency Message Card */}
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block mb-1">
                  Pesan Bantuan Pendaki:
                </span>
                <p className="text-sm font-semibold text-red-950 dark:text-red-200">
                  &ldquo;{selectedSosAlert.message}&rdquo;
                </p>
              </div>

              {/* Hiker Profile Info */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-2.5">
                <div className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Identitas Pendaki
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Nama Lengkap</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedSosAlert.profile?.full_name || "Tidak tersedia (fallback ID)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">No. Telepon</span>
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {selectedSosAlert.profile?.phone || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Email Pemulihan</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedSosAlert.profile?.recovery_email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">User Auth ID</span>
                    <span className="font-mono text-[10px] text-gray-500 truncate block">
                      {selectedSosAlert.user_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Coordinates & Accuracy */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-2.5">
                <div className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Koordinat & Umur Lokasi
                </div>

                {(() => {
                  const locAge = getLocationAge(
                    selectedSosAlert.location_recorded_at,
                    selectedSosAlert.created_at,
                    now
                  )
                  const coords = formatCoordinates(
                    selectedSosAlert.latitude,
                    selectedSosAlert.longitude
                  )
                  const volcano = findNearestVolcano(
                    selectedSosAlert.latitude,
                    selectedSosAlert.longitude
                  )

                  return (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-400 block text-[11px]">Koordinat GPS</span>
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">
                            {coords.display}
                          </span>
                        </div>
                        {selectedSosAlert.accuracy_meters !== null &&
                          selectedSosAlert.accuracy_meters !== undefined && (
                            <span className="px-2 py-1 rounded bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-mono">
                              Akurasi: &plusmn;{Math.round(selectedSosAlert.accuracy_meters)}m
                            </span>
                          )}
                      </div>

                      {volcano && (
                        <div>
                          <span className="text-gray-400 block text-[11px]">Proksimitas Gunung Terdekat</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ⛰️ {volcano.name} ({volcano.distanceKm} km dari puncak)
                          </span>
                        </div>
                      )}

                      <div className="pt-1 border-t border-gray-200/50 dark:border-white/5 space-y-1">
                        <div>
                          <span className="text-gray-400 block text-[11px]">Waktu Koordinat GPS Ponsel</span>
                          <span className="font-semibold text-gray-900 dark:text-white block">
                            🕒 {locAge.exactFullDateTime}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-400 block text-[11px]">Status Kebaruan Lokasi</span>
                          {locAge.isRealtime ? (
                            <span className="inline-block px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-semibold text-[11px] mt-0.5">
                              🟢 Real-time ({locAge.ageText}) — Koordinat diterima langsung dari GPS HP pengguna.
                            </span>
                          ) : locAge.isStale ? (
                            <span className="inline-block px-2 py-1 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-semibold text-[11px] mt-0.5">
                              ⚠️ {locAge.ageText} — Lokasi telah lama tidak diperbarui, jangan diasumsikan realtime.
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 font-semibold text-[11px] mt-0.5">
                              🕒 {locAge.ageText}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <a
                          href={coords.gmapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Buka Lokasi di Google Maps
                        </a>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Timestamps & Audit Log */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Kronologi Waktu Real-Time
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Waktu GPS HP Pengguna</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatFullDateTime(selectedSosAlert.location_recorded_at || selectedSosAlert.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Waktu Sinyal Masuk Backoffice</span>
                    <span>{formatFullDateTime(selectedSosAlert.created_at)}</span>
                  </div>
                  {selectedSosAlert.acknowledged_at && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">Waktu Diakui (Acknowledged)</span>
                      <span>{formatFullDateTime(selectedSosAlert.acknowledged_at)}</span>
                    </div>
                  )}
                  {selectedSosAlert.resolved_at && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">Waktu Selesai (Resolved)</span>
                      <span>{formatFullDateTime(selectedSosAlert.resolved_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${SOS_STATUS_CONFIG[selectedSosAlert.status]?.badgeClass}`}>
                Status: {SOS_STATUS_CONFIG[selectedSosAlert.status]?.label}
              </span>

              <div className="flex items-center gap-2">
                {selectedSosAlert.status === "open" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedSosAlert.id, "acknowledged")
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Konfirmasi Penanganan (Acknowledge)
                  </button>
                )}

                {selectedSosAlert.status === "acknowledged" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedSosAlert.id, "resolved")
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Tandai Selesai (Resolve)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
