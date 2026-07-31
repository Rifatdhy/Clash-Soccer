import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-auth";
import { STORAGE_KEYS } from "@/lib/constants";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STORAGE_KEYS.ADMIN_AUTH_COOKIE)?.value;
  const isAuthenticated = await verifyAdminSessionToken(token);

  return NextResponse.json({ isAuthenticated });
}
