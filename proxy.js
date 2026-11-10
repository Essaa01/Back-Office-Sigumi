import { NextResponse } from "next/server"

function getDefaultRouteForRole(role) {
  if (role === "Dinas Pariwisata") return "/tourism"
  if (role === "Admin Pengelola") return "/admin-management"
  return "/menu"
}

function applyNoCacheHeaders(response) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  )
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  return response
}

export function proxy(request) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.get("sigumi_session")?.value === "1"
  const rawRole = request.cookies.get("sigumi_role")?.value
  const role = rawRole ? decodeURIComponent(rawRole) : null

  // Logged-in user trying to visit /login (e.g. via browser Back/Forward or direct URL)
  if (pathname === "/login") {
    if (hasSession) {
      const target = getDefaultRouteForRole(role)
      return applyNoCacheHeaders(
        NextResponse.redirect(new URL(target, request.url))
      )
    }
    return applyNoCacheHeaders(NextResponse.next())
  }

  // Unauthenticated user trying to visit protected dashboard routes (e.g. via browser Back/Forward)
  if (!hasSession) {
    return applyNoCacheHeaders(
      NextResponse.redirect(new URL("/login", request.url))
    )
  }

  return applyNoCacheHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}

