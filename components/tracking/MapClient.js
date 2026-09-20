"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix Leaflet icon issue in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
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
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [positions, map])
  return null
}

export default function MapClient({ selectedSession, trackPoints }) {
  // Koordinat default (misal Gunung Merapi)
  const defaultCenter = [-34.397, 150.644] 
  const defaultZoom = 13

  // Format array of points [lat, lng] untuk polyline
  const positions = trackPoints?.map(pt => [pt.latitude, pt.longitude]) || []
  
  // Posisi terakhir
  const lastPosition = positions.length > 0 ? positions[positions.length - 1] : null

  return (
    <MapContainer 
      center={lastPosition || defaultCenter} 
      zoom={defaultZoom} 
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {positions.length > 0 && (
        <>
          <MapBounds positions={positions} />
          <Polyline positions={positions} color="blue" weight={4} opacity={0.7} />
          
          <Marker position={positions[0]} icon={customIcon}>
            <Popup>Titik Awal Pendakian</Popup>
          </Marker>

          <Marker position={lastPosition} icon={customIcon}>
            <Popup>
              <b>Posisi Terakhir</b><br/>
              Lat: {lastPosition[0].toFixed(5)}<br/>
              Lng: {lastPosition[1].toFixed(5)}
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  )
}
