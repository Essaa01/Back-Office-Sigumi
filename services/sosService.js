import { supabase } from "../lib/supabase/client.js"
import { canAdminManageSos } from "../lib/utils/sos.js"

export const sosService = {
  /**
   * Fetch all hiking SOS alerts joined with hiker profile and hiking session.
   * Gracefully falls back if profiles or sessions queries fail.
   * @param {Object} options
   * @param {string} [options.status] - Optional filter: 'open', 'acknowledged', 'resolved', 'cancelled'
   * @returns {Promise<{ data: Array, error: any, tableMissing?: boolean }>}
   */
  async getAll({ status } = {}) {
    try {
      let query = supabase
        .from("hiking_sos_alerts")
        .select("*")
        .order("created_at", { ascending: false })

      if (status && status !== "all") {
        query = query.eq("status", status)
      }

      const { data: alerts, error } = await query

      if (error) {
        // Handle case where table has not yet been migrated in Supabase (PGRST205)
        if (error.code === "PGRST205" || error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
          console.warn("hiking_sos_alerts table does not exist yet on Supabase.")
          return { data: [], error, tableMissing: true }
        }
        console.error("Error fetching hiking_sos_alerts:", error)
        return { data: [], error }
      }

      if (!alerts || alerts.length === 0) {
        return { data: [], error: null }
      }

      // Collect userIds and sessionIds for batch joining
      const userIds = [...new Set(alerts.map((a) => a.user_id).filter(Boolean))]
      const sessionIds = [...new Set(alerts.map((a) => a.session_id).filter(Boolean))]

      let profileMap = {}
      if (userIds.length > 0) {
        try {
          const { data: profiles, error: profErr } = await supabase
            .from("profiles")
            .select("id, full_name, phone, recovery_email")
            .in("id", userIds)

          if (!profErr && profiles) {
            profileMap = profiles.reduce((acc, p) => {
              acc[p.id] = p
              return acc
            }, {})
          }
        } catch (e) {
          console.warn("Failed to join profiles; continuing with fallback profile info:", e)
        }
      }

      let sessionMap = {}
      if (sessionIds.length > 0) {
        try {
          const { data: sessions, error: sessErr } = await supabase
            .from("hiking_sessions")
            .select("id, status, started_at, distance_km")
            .in("id", sessionIds)

          if (!sessErr && sessions) {
            sessionMap = sessions.reduce((acc, s) => {
              acc[s.id] = s
              return acc
            }, {})
          }
        } catch (e) {
          console.warn("Failed to join hiking_sessions; continuing with fallback session info:", e)
        }
      }

      // Merge data
      const mergedAlerts = alerts.map((alert) => ({
        ...alert,
        profile: profileMap[alert.user_id] || null,
        session: sessionMap[alert.session_id] || null,
      }))

      return { data: mergedAlerts, error: null }
    } catch (err) {
      console.error("Unexpected error in sosService.getAll:", err)
      return { data: [], error: err }
    }
  },

  /**
   * Fetch single user profile for newly arrived Realtime alert.
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async getProfile(userId) {
    if (!userId) return null
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, recovery_email")
        .eq("id", userId)
        .single()

      if (error) return null
      return data
    } catch {
      return null
    }
  },

  /**
   * Fetch single session details for newly arrived Realtime alert.
   * @param {string} sessionId
   * @returns {Promise<Object|null>}
   */
  async getSession(sessionId) {
    if (!sessionId) return null
    try {
      const { data, error } = await supabase
        .from("hiking_sessions")
        .select("id, status, started_at, distance_km")
        .eq("id", sessionId)
        .single()

      if (error) return null
      return data
    } catch {
      return null
    }
  },

  /**
   * Update SOS Alert handling status (open -> acknowledged -> resolved).
   * Modifies existing row; does not insert new row.
   * @param {string} alertId
   * @param {'acknowledged'|'resolved'|'cancelled'} newStatus
   * @param {string} adminRole - Logged-in admin role for permission check
   * @returns {Promise<{ data: Object|null, error: any }>}
   */
  async updateStatus(alertId, newStatus, adminRole) {
    if (!canAdminManageSos(adminRole)) {
      const authErr = new Error("Akses ditolak: Hanya peran BPBD dan MDMC yang berwenang mengubah status penanganan SOS.")
      return { data: null, error: authErr }
    }

    if (!["acknowledged", "resolved", "cancelled"].includes(newStatus)) {
      return { data: null, error: new Error(`Status tidak valid: ${newStatus}`) }
    }

    const payload = {
      status: newStatus,
    }

    const nowIso = new Date().toISOString()
    if (newStatus === "acknowledged") {
      payload.acknowledged_at = nowIso
    } else if (newStatus === "resolved") {
      payload.resolved_at = nowIso
    }

    try {
      const { data, error } = await supabase
        .from("hiking_sos_alerts")
        .update(payload)
        .eq("id", alertId)
        .select()
        .single()

      if (error) {
        console.error("Error updating SOS status:", error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error("Unexpected error in updateStatus:", err)
      return { data: null, error: err }
    }
  },

  /**
   * Subscribe to Supabase Realtime changes for hiking_sos_alerts table.
   * Returns a cleanup function to unsubscribe.
   * @param {Object} handlers
   * @param {(newRecord: Object) => void} handlers.onInsert
   * @param {(updatedRecord: Object) => void} handlers.onUpdate
   * @param {(deletedRecord: Object) => void} handlers.onDelete
   * @param {(status: string, error?: any) => void} handlers.onStatusChange
   * @returns {() => void} unsubscribe
   */
  subscribeToAlerts({ onInsert, onUpdate, onDelete, onStatusChange }) {
    const channelName = `hiking-sos-realtime-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hiking_sos_alerts",
        },
        async (payload) => {
          if (onInsert && payload.new) {
            // Enrich with profile and session if available
            const [profile, session] = await Promise.all([
              payload.new.user_id ? sosService.getProfile(payload.new.user_id) : Promise.resolve(null),
              payload.new.session_id ? sosService.getSession(payload.new.session_id) : Promise.resolve(null),
            ])
            onInsert({ ...payload.new, profile, session })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "hiking_sos_alerts",
        },
        (payload) => {
          if (onUpdate && payload.new) {
            onUpdate(payload.new)
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "hiking_sos_alerts",
        },
        (payload) => {
          if (onDelete && payload.old) {
            onDelete(payload.old)
          }
        }
      )
      .subscribe((status, err) => {
        if (onStatusChange) {
          onStatusChange(status, err)
        }
      })

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (err) {
        console.warn("Error removing realtime channel:", err)
      }
    }
  },
}
