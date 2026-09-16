import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_SESSION_COOKIE = "admin_session";

export function hashAdminPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { salt, hash };
}

export function verifyAdminPassword(password: string, salt: string, hash: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return checkHash === hash;
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, email.trim().toLowerCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

/**
 * Ensures the admin_users table exists in Turso and the default admin is seeded.
 */
export async function ensureAdminInitialized() {
  try {
    // Check if default admin exists
    const defaultEmail = "om5555enterprises@gmail.com";
    const existing = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, defaultEmail))
      .limit(1);

    if (existing.length === 0) {
      const { salt, hash } = hashAdminPassword("Om@5555");
      await db.insert(adminUsers).values({
        email: defaultEmail,
        fullName: "OM Enterprises Administrator",
        passwordHash: hash,
        salt: salt,
        role: "superadmin",
        createdAt: new Date().toISOString(),
      });
      console.log("[Admin Auth] Default admin user initialized in admin_users table.");
    }
  } catch (err: any) {
    // If the table doesn't exist yet, create it via raw SQL query
    if (err.message && (err.message.includes("no such table") || err.message.includes("admin_users"))) {
      try {
        const { client } = await import("@/db");
        await client.execute(`
          CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            full_name TEXT,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT DEFAULT 'superadmin',
            created_at TEXT,
            last_login_at TEXT
          );
        `);
        const { salt, hash } = hashAdminPassword("Om@5555");
        await client.execute({
          sql: `INSERT OR IGNORE INTO admin_users (email, full_name, password_hash, salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?);`,
          args: ["om5555enterprises@gmail.com", "OM Enterprises Administrator", hash, salt, "superadmin", new Date().toISOString()],
        });
        console.log("[Admin Auth] admin_users table created and seeded successfully.");
      } catch (innerErr) {
        console.error("[Admin Auth] Failed to initialize admin_users table:", innerErr);
      }
    } else {
      console.error("[Admin Auth] Error ensuring admin initialized:", err);
    }
  }
}
