import { createClient } from "@supabase/supabase-js"

const DEFAULT_SUPABASE_URL = "http://187.53.141.200:8000"
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2FudGVlY3J2eWR4eXJncGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzU2NTQsImV4cCI6MjA5MDgxMTY1NH0.ofz33s1PLvEGu_rgnu1CTXt_IUKOi0Ppni_8rvCxKrU"

function resolveBrowserSupabaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  if (
    typeof window !== "undefined" &&
    window.location?.protocol === "https:" &&
    configuredUrl.startsWith("http://")
  ) {
    return `${window.location.origin}/supabase-proxy`
  }
  return configuredUrl
}

export const supabase = createClient(
  resolveBrowserSupabaseUrl(),
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
)
