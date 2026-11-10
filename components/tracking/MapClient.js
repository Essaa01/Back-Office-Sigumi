"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { getLocationAge, formatCoordinates, findNearestVolcano, formatLocalTime, formatFullDateTime, SOS_STATUS_CONFIG } from "@/lib/utils/sos"

// Fix standard Leaflet marker icon
const defaultMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Start point marker icon (green)
const startMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Auto zoom/pan map to fit polyline
function MapBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    }
  }, [positions, map])
  return null
}

// Fly to target coordinate smoothly
function MapFlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target && typeof target[0] === "number" && typeof target[1] === "number" && !isNaN(target[0]) && !isNaN(target[1])) {
      map.flyTo(target, 16, { duration: 1.2 })
    }
  }, [target, map])
  return null
}

/**
 * Creates custom div icon for SOS emergency markers.
 * Visually distinct from start/end track points.
 */
function createSosIcon(status, isSelected) {
  const isOpen = status === "open"
  const isAck = status === "acknowledged"
  const isResolved = status === "resolved"

  const bg = isOpen
    ? "#dc2626" // red-600
    : isAck
    ? "#f59e0b" // amber-500
    : isResolved
    ? "#059669" // emerald-600
    : "#6b7280" // gray-500

  const pingHtml = isOpen
    ? `<span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: #ef4444; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
    : ""

  const ringStyle = isSelected
    ? "outline: 4px solid #f87171; outline-offset: 2px;"
    : "box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);"

  return L.divIcon({
    className: "custom-sos-div-icon",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
        ${pingHtml}
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 9999px; background-color: ${bg}; color: white; font-weight: 900; font-size: 11px; border: 2.5px solid white; ${ringStyle}">
          SOS
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  })
}

export default function MapClient({
  selectedSession,
  trackPoints = [],
  sosAlerts = [],
  selectedSosAlert = null,
  now = Date.now(),
  onSelectSosAlert,
  onUpdateSosStatus,
}) {
  // Default coordinates: Gunung Merapi, Indonesia
  const defaultCenter = [-7.5407, 110.4463]
  const defaultZoom = 12

  // Format array of points [lat, lng] for polyline
  const positions = useMemo(() => {
    return trackPoints?.map((pt) => [pt.latitude, pt.longitude]) || []
  }, [trackPoints])

  const lastPosition = positions.length > 0 ? positions[positions.length - 1] : null

  // Fly target: prioritize selected SOS alert, otherwise last session position
  const flyTarget = selectedSosAlert
    ? [selectedSosAlert.latitude, selectedSosAlert.longitude]
    : null

  // Center on mount
  const initialCenter = selectedSosAlert
    ? [selectedSosAlert.latitude, selectedSosAlert.longitude]
    : lastPosition || defaultCenter

  return (
    <MapContainer
      center={initialCenter}
      zoom={defaultZoom}
      style={{ height: "100%", width: "100%", borderRadius: "1rem", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Fly / Bounds controllers */}
      {flyTarget && <MapFlyTo target={flyTarget} />}
      {!flyTarget && positions.length > 0 && <MapBounds positions={positions} />}

      {/* Route track polyline */}
      {positions.length > 0 && (
        <>
          <Polyline positions={positions} color="#2563eb" weight={4} opacity={0.8} />

          {/* Start Point */}
          <Marker position={positions[0]} icon={startMarkerIcon}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-green-700 block mb-1">🏁 Titik Awal Pendakian</span>
                <span>Lat: {positions[0][0].toFixed(5)}</span><br />
                <span>Lng: {positions[0][1].toFixed(5)}</span>
              </div>
            </Popup>
          </Marker>

          {/* Current / Last Track Point */}
          {lastPosition && (() => {
            const lastTrackPt = trackPoints.length > 0 ? trackPoints[trackPoints.length - 1] : null
            const ptTime = lastTrackPt?.recorded_at || selectedSession?.last_point_at
            const ptAge = ptTime ? getLocationAge(ptTime, selectedSession?.started_at, now) : null

            return (
              <Marker position={lastPosition} icon={defaultMarkerIcon}>
                <Popup>
                  <div className="text-xs font-sans p-0.5 min-w-[210px]">
                    <div className="flex items-center justify-between border-b pb-1.5 mb-1.5">
                      <span className="font-bold text-blue-700 flex items-center gap-1">
                        📍 Posisi Terakhir
                      </span>
                      {ptAge && (
                        ptAge.isRealtime ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-time
                          </span>
                        ) : ptAge.isStale ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            ⚠️ Usang
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 font-medium">
                            🕒 {ptAge.ageText}
                          </span>
                        )
                      )}
                    </div>

                    <div className="space-y-1 mb-2 text-gray-700">
                      <div>
                        <b>Pendaki:</b> {selectedSession?.username || "Pendaki"}
                      </div>
                      {ptTime && (
                        <div className="text-gray-900 font-medium">
                          🕒 <b>Waktu GPS HP:</b> {formatLocalTime(ptTime)}
                        </div>
                      )}
                      {selectedSession?.started_at && (
                        <div className="text-gray-500 text-[11px]">
                          🏁 <b>Mulai:</b> {formatLocalTime(selectedSession.started_at)}
                        </div>
                      )}
                      <div>
                        <b>Koordinat:</b> {lastPosition[0].toFixed(5)}, {lastPosition[1].toFixed(5)}
                        {lastTrackPt?.accuracy_meters !== null && lastTrackPt?.accuracy_meters !== undefined && (
                          <span className="text-gray-400 ml-1">(&plusmn;{Math.round(lastTrackPt.accuracy_meters)}m)</span>
                        )}
                      </div>
                      {selectedSession?.distance_km !== undefined && (
                        <div className="text-gray-600">
                          <b>Jarak:</b> {selectedSession.distance_km.toFixed(2)} km
                        </div>
                      )}
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${lastPosition[0]},${lastPosition[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center py-1 px-2 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-[11px] transition-colors"
                    >
                      Buka di Google Maps
                    </a>
                  </div>
                </Popup>
              </Marker>
            )
          })()}
        </>
      )}

      {/* Emergency SOS Markers */}
      {sosAlerts.map((sos) => {
        if (typeof sos.latitude !== "number" || typeof sos.longitude !== "number") return null

        const isSelected = selectedSosAlert?.id === sos.id
        const sosPos = [sos.latitude, sos.longitude]
        const locationAge = getLocationAge(sos.location_recorded_at, sos.created_at, now)
        const coords = formatCoordinates(sos.latitude, sos.longitude)
        const volcano = findNearestVolcano(sos.latitude, sos.longitude)
        const statusCfg = SOS_STATUS_CONFIG[sos.status] || SOS_STATUS_CONFIG.open

        return (
          <Marker
            key={sos.id || sos.client_alert_id}
            position={sosPos}
            icon={createSosIcon(sos.status, isSelected)}
            zIndexOffset={isSelected ? 1000 : 500}
            eventHandlers={{
              click: () => {
                if (onSelectSosAlert) onSelectSosAlert(sos)
              },
            }}
          >
            <Popup>
              <div className="text-xs font-sans p-1 min-w-[220px]">
                {/* Header status */}
                <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-2">
                  <span className="font-bold text-red-600 flex items-center gap-1">
                    🚨 SOS ALERT
                  </span>
                  <div className="flex items-center gap-1">
                    {locationAge.isRealtime && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-time
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusCfg.badgeClass}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Hiker Info */}
                <div className="mb-2">
                  <div className="font-bold text-sm text-gray-900">
                    {sos.profile?.full_name || "Pendaki Tidak Dikenal"}
                  </div>
                  {sos.profile?.phone && (
                    <div className="text-gray-600">Telp: {sos.profile.phone}</div>
                  )}
                </div>

                {/* Emergency Message */}
                <div className="p-2 rounded bg-red-50 text-red-900 border border-red-200 mb-2 font-medium">
                  &ldquo;{sos.message}&rdquo;
                </div>

                {/* Mountain proximity */}
                {volcano && (
                  <div className="text-gray-600 mb-1">
                    ⛰️ <b>{volcano.name}</b> ({volcano.distanceKm} km)
                  </div>
                )}

                {/* Coordinates & Accuracy */}
                <div className="text-gray-500 font-mono text-[11px] mb-1">
                  Koordinat: {coords.display}
                  {sos.accuracy_meters !== null && sos.accuracy_meters !== undefined && (
                    <span className="ml-1 text-gray-400">(&plusmn;{Math.round(sos.accuracy_meters)}m)</span>
                  )}
                </div>

                {/* Exact Mobile Time & Age */}
                <div className="space-y-1 mb-2 pt-1 border-t border-gray-100">
                  <div className="text-gray-800 font-medium">
                    🕒 <b>Waktu GPS HP:</b> {locationAge.exactTime}
                  </div>
                  {sos.created_at && (
                    <div className="text-gray-500 text-[11px]">
                      📡 <b>Sinyal Masuk:</b> {formatLocalTime(sos.created_at)}
                    </div>
                  )}
                  <div>
                    {locationAge.isRealtime ? (
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                        🟢 Real-time ({locationAge.ageText})
                      </span>
                    ) : locationAge.isStale ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                        ⚠️ {locationAge.ageText}
                      </span>
                    ) : (
                      <span className="text-gray-600 font-medium text-[11px]">
                        🕒 {locationAge.ageText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t flex flex-col gap-1.5">
                  <a
                    href={coords.gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center py-1 px-2 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                  >
                    Buka Google Maps
                  </a>

                  {statusCfg.nextStatus && onUpdateSosStatus && (
                    <button
                      type="button"
                      onClick={() => onUpdateSosStatus(sos.id, statusCfg.nextStatus)}
                      className="w-full py-1.5 px-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      {statusCfg.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
