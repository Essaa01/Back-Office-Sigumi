import { supabase } from "@/lib/supabase/client"
import { getAdminLocation, isGlobalScope } from "@/lib/utils/auth"

export const trackingService = {
  // Ambil semua sesi aktif
  async getActiveSessions() {
    // Note: Karena tabel hiking_sessions tidak punya kolom 'region' langsung,
    // kita akan ambil semua data, atau join dengan tabel profile jika perlu filter by lokasi.
    // Sementara kita ambil semua yang 'active'
    const { data: sessions, error } = await supabase
      .from("hiking_sessions")
      .select("*")
      .eq("status", "active")
      .order("started_at", { ascending: false })

    if (error || !sessions || sessions.length === 0) {
      return { data: sessions, error }
    }

    // Ambil username dari tabel profiles secara manual karena tidak ada foreign key langsung
    const userIds = sessions.map(s => s.user_id)
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds)

    console.log("DEBUG: Profiles fetched:", profiles, profError)

    // Gabungkan username ke dalam data sesi
    if (profiles) {
      const profileMap = profiles.reduce((acc, p) => {
        acc[p.id] = p.full_name || "Pendaki"
        return acc
      }, {})
      
      console.log("DEBUG: Profile map:", profileMap)
      
      const merged = sessions.map(s => ({
        ...s,
        username: profileMap[s.user_id] || null
      }))
      return { data: merged, error: null }
    }

    return { data: sessions, error }
  },

  // Ambil detail rute dari track_points
  async getSessionTrack(sessionId) {
    const { data, error } = await supabase
      .from("hiking_track_points")
      .select("*")
      .eq("session_id", sessionId)
      .order("recorded_at", { ascending: true })

    if (error) {
      console.error("Error fetching track:", error)
      return { data: null, error }
    }
    return { data, error }
  }
}
