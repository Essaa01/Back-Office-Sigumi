import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 })

  response.cookies.set("sigumi_session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax",
    httpOnly: false,
  })

  response.cookies.set("sigumi_role", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax",
    httpOnly: false,
  })

  return response
}

