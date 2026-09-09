import crypto from "crypto";
import { cookies } from "next/headers";

const CRM_SESSION_COOKIE = "crm_session";

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return checkHash === hash;
}

export async function setCrmSession(userId: number, email: string) {
  const cookieStore = await cookies();
  const sessionPayload = JSON.stringify({ userId, email });
  const encoded = Buffer.from(sessionPayload).toString("base64");

  cookieStore.set(CRM_SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function getCrmSession(): Promise<{ userId: number; email: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(CRM_SESSION_COOKIE)?.value;
    if (!sessionCookie) return null;

    const decoded = Buffer.from(sessionCookie, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (!parsed?.userId || !parsed?.email) return null;

    return { userId: parsed.userId, email: parsed.email };
  } catch {
    return null;
  }
}

export async function clearCrmSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CRM_SESSION_COOKIE);
}
