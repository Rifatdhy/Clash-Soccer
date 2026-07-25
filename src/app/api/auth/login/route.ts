import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, createAdminSessionToken } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Get credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "change_this_password";

    if (username === adminUsername && password === adminPassword) {
      const token = await createAdminSessionToken(username);
      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        user: { username },
      });

      response.cookies.set(ADMIN_AUTH_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}