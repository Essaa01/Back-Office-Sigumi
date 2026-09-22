import { supabase } from "@/lib/supabase/client"
import { getAdminLocation } from "@/lib/utils/auth"

export const shelterService = {
  async getAll() {
    let query = supabase.from("shelters").select("*").order("created_at", { ascending: false })
    
    const adminLocation = getAdminLocation()
    if (adminLocation) {
      query = query.eq("lokasi", adminLocation)
    }

    return await query
  },

  async getVolcanoes() {
    return await supabase.from("volcanoes").select("id, name").order("name")
  },

  async create(data) {
    const adminLocation = getAdminLocation()
    
    // Volcano to Region Mapping (fallback)
    const volcanoConfigs = {
      "a1b2c3d4-e5f6-7890-abcd-111111111111": "Yogyakarta",
      "a1b2c3d4-e5f6-7890-abcd-222222222222": "Bali",
      "a1b2c3d4-e5f6-7890-abcd-333333333333": "Lombok",
    }

    const { lat, lng, ...rest } = data
    const locationWkt = (lat && lng) ? `POINT(${lng} ${lat})` : null
    const determinedRegion = volcanoConfigs[data.volcano_id] || adminLocation

    const payload = {
      ...rest,
      location: locationWkt,
      lokasi: determinedRegion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const result = await supabase.from("shelters").insert([payload])
    
    if (result.error?.message?.includes("updated_at") || result.error?.message?.includes("created_at")) {
        const fallbackPayload = {
          ...rest,
          location: locationWkt,
          lokasi: determinedRegion,
        }
        return await supabase.from("shelters").insert([fallbackPayload])
    }

    return result
  },

  async delete(id) {
    const adminLocation = getAdminLocation()
    let query = supabase.from("shelters").delete().eq("id", id)
    if (adminLocation) query = query.eq("lokasi", adminLocation)
    return await query
  },

  async update(id, data) {
    const adminLocation = getAdminLocation()
    
    const { id: _id, created_at, location: _loc, lat, lng, ...rest } = data
    const locationWkt = (lat && lng) ? `POINT(${lng} ${lat})` : null

    const payload = {
      ...rest,
      updated_at: new Date().toISOString(),
    }
    
    if (locationWkt) {
      payload.location = locationWkt
    }
    
    let query = supabase.from("shelters").update(payload).eq("id", id)
    if (adminLocation) query = query.eq("lokasi", adminLocation)
    
    const result = await query
    
    if (result.error?.message?.includes("updated_at")) {
        const fallbackPayload = { ...payload }
        delete fallbackPayload.updated_at
        let fallbackQuery = supabase.from("shelters").update(fallbackPayload).eq("id", id)
        if (adminLocation) fallbackQuery = fallbackQuery.eq("lokasi", adminLocation)
        return await fallbackQuery
    }

    return result
  },

  async getById(id) {
    const adminLocation = getAdminLocation()
    let query = supabase.from("shelters").select("*").eq("id", id)
    if (adminLocation) query = query.eq("lokasi", adminLocation)
    return await query.single()
  },
}
