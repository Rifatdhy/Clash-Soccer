import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_AUTH_COOKIE)?.value;
  const authenticated = await verifyAdminSessionToken(token);

  return NextResponse.json({ authenticated });
}