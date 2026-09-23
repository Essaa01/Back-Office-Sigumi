import { supabase } from "@/lib/supabase/client"

const MANAGED_ROLES = ["BPBD", "MDMC", "Dinas Pariwisata"]

export const adminManagementService = {
  /**
   * Get all admin accounts with roles managed by Admin Pengelola.
   */
  async getAll() {
    return await supabase
      .from("admins")
      .select("id, email, role, lokasi, created_at")
      .in("role", MANAGED_ROLES)
      .order("created_at", { ascending: false })
  },

  /**
   * Create a new admin account.
   * @param {{ email: string, password: string, role: string, lokasi: string|null }} payload
   */
  async create({ email, password, role, lokasi }) {
    return await supabase
      .from("admins")
      .insert([{ email, password, role, lokasi: lokasi || null }])
      .select()
  },

  /**
   * Update admin password and/or lokasi.
   * @param {string} id
   * @param {{ password?: string, lokasi?: string|null }} payload
   */
  async update(id, payload) {
    return await supabase
      .from("admins")
      .update(payload)
      .eq("id", id)
      .select()
  },

  /**
   * Delete an admin account.
   * @param {string} id
   */
  async delete(id) {
    return await supabase.from("admins").delete().eq("id", id)
  },
}
