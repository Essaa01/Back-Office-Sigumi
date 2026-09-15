import { supabase } from "@/lib/supabase/client"

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

export const uploadImage = async (file) => {
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : ""
  const baseName = file.name
    .slice(0, file.name.length - extension.length)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  const fileName = `${Date.now()}-${baseName || "media"}${extension}`

  const contentType = file.type || MIME_MAP[extension] || "application/octet-stream"

  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, file, {
      contentType,
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage
    .from("images")
    .getPublicUrl(fileName)

  return data.publicUrl
}

export const uploadMedia = uploadImage