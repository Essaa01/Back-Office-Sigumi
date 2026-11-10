import test from "node:test"
import assert from "node:assert/strict"
import { sosService } from "../services/sosService.js"

test("9. sosService.updateStatus rejects unauthorized admin roles", async () => {
  // Test with unauthorized role "Dinas Pariwisata"
  const resultDinas = await sosService.updateStatus("alert-123", "acknowledged", "Dinas Pariwisata")
  assert.equal(resultDinas.data, null)
  assert.match(resultDinas.error.message, /Akses ditolak/)

  // Test with null role
  const resultNull = await sosService.updateStatus("alert-123", "acknowledged", null)
  assert.equal(resultNull.data, null)
  assert.match(resultNull.error.message, /Akses ditolak/)

  // Test with invalid status
  const resultInvalidStatus = await sosService.updateStatus("alert-123", "unknown_status", "BPBD")
  assert.equal(resultInvalidStatus.data, null)
  assert.match(resultInvalidStatus.error.message, /Status tidak valid/)
})

test("10. Server API route security check", async () => {
  // Ensure SUPABASE_SERVICE_ROLE_KEY is never defined as a client-side NEXT_PUBLIC_ variable
  const envKeys = Object.keys(process.env)
  const leakedServiceKey = envKeys.find((k) => k.startsWith("NEXT_PUBLIC_") && k.includes("SERVICE_ROLE"))
  assert.equal(leakedServiceKey, undefined, "Service role key tidak boleh diekspos sebagai variabel NEXT_PUBLIC_")
})

