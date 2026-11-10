import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const COOKIE_MAX_AGE = 60 * 60 // 1 hour

const DEFAULT_SUPABASE_URL = "http://187.53.141.200:8000"
const DEFAULT_STORAGE_SUPABASE_URL = "https://rtwanteecrvydxyrgpii.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2FudGVlY3J2eWR4eXJncGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzU2NTQsImV4cCI6MjA5MDgxMTY1NH0.ofz33s1PLvEGu_rgnu1CTXt_IUKOi0Ppni_8rvCxKrU"

function getClients() {
  const urls = [
    process.env.INTERNAL_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    DEFAULT_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL,
    DEFAULT_STORAGE_SUPABASE_URL,
  ].filter(Boolean)

  const uniqueUrls = [...new Set(urls)]
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY

  return uniqueUrls.map((url) =>
    createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  )
}

export async function POST(request) {
  try {
    const body = await request.json()
    const rawEmail = typeof body?.email === "string" ? body.email.trim() : ""
    const rawPassword = typeof body?.password === "string" ? body.password : ""

    if (!rawEmail || !rawPassword) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      )
    }

    const clients = getClients()
    let matchedAdmin = null
    let lastError = null
    let querySucceeded = false

    for (const client of clients) {
      try {
        const { data, error } = await client
          .from("admins")
          .select("*")
          .ilike("email", rawEmail)
          .eq("password", rawPassword)
          .limit(1)

        if (error) {
          lastError = error
          continue
        }

        querySucceeded = true

        if (Array.isArray(data) && data.length > 0) {
          matchedAdmin = data[0]
          break
        }
      } catch (err) {
        lastError = err
      }
    }

    if (!matchedAdmin) {
      if (!querySucceeded && lastError) {
        console.error("Login Supabase query error:", lastError)
        return NextResponse.json(
          { error: "Gagal terhubung ke server autentikasi" },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: "Email atau password yang Anda masukkan salah" },
        { status: 401 }
      )
    }

    const adminPayload = {
      id: matchedAdmin.id,
      email: matchedAdmin.email,
      lokasi: matchedAdmin.lokasi ?? null,
      role: matchedAdmin.role || "BPBD",
    }

    const response = NextResponse.json({ data: adminPayload }, { status: 200 })

    response.cookies.set("sigumi_session", "1", {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      httpOnly: false,
    })

    response.cookies.set("sigumi_role", encodeURIComponent(adminPayload.role), {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      httpOnly: false,
    })

    return response
  } catch (err) {
    console.error("Unexpected error in POST /api/auth/login:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses login" },
      { status: 500 }
    )
  }
}

