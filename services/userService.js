import { supabase } from "@/lib/supabase/client"

export const userService = {
  async getAll() {
    return await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
  },

  async getById(id) {
    return await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()
  },

  async update(id, payload) {
    return await supabase
      .from("profiles")
      .update(payload)
      .eq("id", id)
      .select()
  },

  async delete(id) {
    return await supabase.from("profiles").delete().eq("id", id)
  },
}
