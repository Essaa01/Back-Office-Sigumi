import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { canAdminManageSos } from "@/lib/utils/sos"

/**
 * Server-side Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY if configured in server environment;
 * otherwise safely falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Service role key is NEVER sent to the browser or frontend bundle.
 */
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const supabase = getServerSupabase()
    let query = supabase
      .from("hiking_sos_alerts")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: alerts, error } = await query

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
        return NextResponse.json({ data: [], tableMissing: true }, { status: 200 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    // Join profiles and sessions
    const userIds = [...new Set(alerts.map((a) => a.user_id).filter(Boolean))]
    const sessionIds = [...new Set(alerts.map((a) => a.session_id).filter(Boolean))]

    let profileMap = {}
    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone, recovery_email")
          .in("id", userIds)

        if (profiles) {
          profileMap = profiles.reduce((acc, p) => {
            acc[p.id] = p
            return acc
          }, {})
        }
      } catch (e) {
        console.warn("Server API: profile join warning:", e)
      }
    }

    let sessionMap = {}
    if (sessionIds.length > 0) {
      try {
        const { data: sessions } = await supabase
          .from("hiking_sessions")
          .select("id, status, started_at, distance_km")
          .in("id", sessionIds)

        if (sessions) {
          sessionMap = sessions.reduce((acc, s) => {
            acc[s.id] = s
            return acc
          }, {})
        }
      } catch (e) {
        console.warn("Server API: session join warning:", e)
      }
    }

    const merged = alerts.map((a) => ({
      ...a,
      profile: profileMap[a.user_id] || null,
      session: sessionMap[a.session_id] || null,
    }))

    return NextResponse.json({ data: merged }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { alertId, status, role } = body

    if (!canAdminManageSos(role)) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya BPBD dan MDMC yang berwenang mengubah status SOS." },
        { status: 403 }
      )
    }

    if (!alertId || !["acknowledged", "resolved", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const payload = { status }
    const nowIso = new Date().toISOString()
    if (status === "acknowledged") payload.acknowledged_at = nowIso
    if (status === "resolved") payload.resolved_at = nowIso

    const { data, error } = await supabase
      .from("hiking_sos_alerts")
      .update(payload)
      .eq("id", alertId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

