import { createClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

const DEFAULT_STORAGE_SUPABASE_URL = "https://rtwanteecrvydxyrgpii.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2FudGVlY3J2eWR4eXJncGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzU2NTQsImV4cCI6MjA5MDgxMTY1NH0.ofz33s1PLvEGu_rgnu1CTXt_IUKOi0Ppni_8rvCxKrU"

const MIME_MAP = {
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".json": "application/json",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
}

let storageClientInstance = null

const getStorageClient = () => {
  if (storageClientInstance) return storageClientInstance

  const storageUrl =
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("supabase.co")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : DEFAULT_STORAGE_SUPABASE_URL)

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  if (storageUrl && anonKey) {
    storageClientInstance = createClient(storageUrl, anonKey)
    return storageClientInstance
  }

  if (anonKey) {
    try {
      const payloadBase64 = anonKey.split(".")[1]
      if (payloadBase64) {
        const decoded =
          typeof window !== "undefined"
            ? atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
            : Buffer.from(payloadBase64, "base64url").toString("utf-8")
        const payload = JSON.parse(decoded)
        if (payload?.ref) {
          storageClientInstance = createClient(`https://${payload.ref}.supabase.co`, anonKey)
          return storageClientInstance
        }
      }
    } catch {
      // fallback
    }
  }

  storageClientInstance = supabase
  return storageClientInstance
}

export const uploadImage = async (file) => {
  const rawName = file?.name || file?.filename || "media.jpg"
  const extension = rawName.includes(".")
    ? rawName.slice(rawName.lastIndexOf(".")).toLowerCase()
    : ""
  const baseName = rawName
    .slice(0, rawName.length - extension.length)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  const fileName = `${Date.now()}-${baseName || "media"}${extension || ".jpg"}`

  const contentType = file.type || MIME_MAP[extension] || "application/octet-stream"

  const client = getStorageClient()
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "images"

  const { error } = await client.storage
    .from(bucket)
    .upload(fileName, file, {
      contentType,
      upsert: false,
    })

  if (error) throw error

  const { data } = client.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return data.publicUrl
}

export const uploadMedia = uploadImage
