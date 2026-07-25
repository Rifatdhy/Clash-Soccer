import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout successful",
  });

  response.cookies.set(ADMIN_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}