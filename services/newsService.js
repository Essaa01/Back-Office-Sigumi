import { supabase } from "@/lib/supabase/client"
import { getAdminLocation } from "@/lib/utils/auth"

const ALL_LOCATIONS = ["Yogyakarta", "Bali", "Lombok"]

export const newsService = {
  async getAll() {
    let query = supabase.from("news").select("*").order("created_at", { ascending: false })
    
    const adminLocation = getAdminLocation()
    if (adminLocation) {
      query = query.eq("lokasi", adminLocation)
    }

    const { data, error } = await query
    if (error || !data) return { data, error }

    if (!adminLocation) {
      const groupedMap = new Map()

      for (const item of data) {
        const groupKey = `${item.title}_${item.created_at}`
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, [item])
        } else {
          groupedMap.get(groupKey).push(item)
        }
      }

      const deduplicated = []
      for (const [, items] of groupedMap) {
        if (items.length >= 3) {
          deduplicated.push({
            ...items[0],
            lokasi: "Semua Wilayah",
            sibling_ids: items.map((i) => i.id),
          })
        } else {
          deduplicated.push(...items)
        }
      }

      return { data: deduplicated, error: null }
    }

    return { data, error: null }
  },

  async create(data) {
    const adminLocation = getAdminLocation()
    const now = new Date().toISOString()

    if (data.lokasi === "Semua Wilayah") {
      const rows = ALL_LOCATIONS.map((loc) => ({
        ...data,
        lokasi: loc,
        created_at: now,
        updated_at: now,
      }))

      const result = await supabase.from("news").insert(rows)

      if (result.error?.message?.includes("updated_at")) {
        const fallbackRows = ALL_LOCATIONS.map((loc) => ({
          ...data,
          lokasi: loc,
          created_at: now,
        }))
        return await supabase.from("news").insert(fallbackRows)
      }

      return result
    }
    
    const payload = {
      ...data,
      ...(adminLocation && { lokasi: adminLocation }),
      created_at: now,
      updated_at: now,
    }

    const result = await supabase.from("news").insert([payload])

    if (result.error?.message?.includes("updated_at")) {
      const fallbackPayload = {
        ...data,
        ...(adminLocation && { lokasi: adminLocation }),
        created_at: now,
      }
      return await supabase.from("news").insert([fallbackPayload])
    }

    return result
  },

  async getById(id) {
    const adminLocation = getAdminLocation()
    let query = supabase.from("news").select("*").eq("id", id)
    if (adminLocation) query = query.eq("lokasi", adminLocation)
    return await query.single()
  },

  async delete(id) {
    const adminLocation = getAdminLocation()
    
    const { data: item } = await supabase.from("news").select("title, created_at").eq("id", id).single()
    
    if (item && item.title && item.created_at && !adminLocation) {
      return await supabase
        .from("news")
        .delete()
        .eq("title", item.title)
        .eq("created_at", item.created_at)
    }

    let query = supabase.from("news").delete().eq("id", id)
    if (adminLocation) query = query.eq("lokasi", adminLocation)
    return await query
  },

  async update(id, data) {
    const adminLocation = getAdminLocation()
    const now = new Date().toISOString()

    const { data: targetItem } = await supabase.from("news").select("title, created_at, lokasi").eq("id", id).single()

    if (targetItem && targetItem.created_at && !adminLocation) {
      const payload = {
        ...data,
        updated_at: now,
      }
      
      if (data.lokasi && data.lokasi !== "Semua Wilayah") {
        payload.lokasi = data.lokasi
      } else if (data.lokasi === "Semua Wilayah") {
        delete payload.lokasi
      }

      let query = supabase
        .from("news")
        .update(payload)
        .eq("title", targetItem.title)
        .eq("created_at", targetItem.created_at)

      const result = await query
      if (result.error?.message?.includes("updated_at")) {
        delete payload.updated_at
        return await supabase
          .from("news")
          .update(payload)
          .eq("title", targetItem.title)
          .eq("created_at", targetItem.created_at)
      }
      return result
    }

    const payload = {
      ...data,
      updated_at: now,
    }

    let query = supabase.from("news").update(payload).eq("id", id)
    if (adminLocation) query = query.eq("lokasi", adminLocation)
    
    const result = await query

    if (result.error?.message?.includes("updated_at")) {
      delete payload.updated_at
      let fallbackQuery = supabase.from("news").update(payload).eq("id", id)
      if (adminLocation) fallbackQuery = fallbackQuery.eq("lokasi", adminLocation)
      return await fallbackQuery
    }

    return result
  },
}