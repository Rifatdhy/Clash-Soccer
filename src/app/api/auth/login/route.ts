import { z } from "zod";
import crypto from "crypto";
import { createAdminSessionToken } from "@/lib/admin-auth";
import { STORAGE_KEYS } from "@/lib/constants";
import { success, unauthorized, serverError, validate, tooManyRequests } from "@/lib/api-helpers";
import { consume, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Constant-time comparison to prevent timing attacks using SHA-256 to allow differing lengths safely
function timingSafeEqual(a: string, b: string) {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(req: Request) {
  return validate(req, loginSchema, async (data) => {
    try {
      const ip = getClientIp(req);
      const limited = await consume("login", ip);
      if (!limited.allowed) {
        return tooManyRequests("Too many login attempts. Please try again later.");
      }

      const { username, password } = data;

      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD;

      if (!adminUsername || !adminPassword) {
        return serverError(
          new Error("Missing admin credentials in environment"),
          "Server configuration error"
        );
      }

      const isUsernameMatch = timingSafeEqual(username, adminUsername);
      const isPasswordMatch = verifyPassword(password, adminPassword);

      if (isUsernameMatch && isPasswordMatch) {
        await resetRateLimit("login", ip);
        const token = await createAdminSessionToken(username);
        const response = success({ message: "Login successful", user: { username } });

        response.cookies.set(STORAGE_KEYS.ADMIN_AUTH_COOKIE, token, {
          httpOnly: true,
          sameSite: "strict", // Use 'strict' for better security
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });

        return response;
      }

      return unauthorized("Invalid credentials");
    } catch (e) {
      return serverError(e, "Error during login process");
    }
  });
}
