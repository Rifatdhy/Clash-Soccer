import { NextResponse } from "next/server";
import { STORAGE_KEYS } from "@/lib/constants";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout successful",
  });

  response.cookies.set(STORAGE_KEYS.ADMIN_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}