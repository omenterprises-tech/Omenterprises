import { NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyAdminPassword, setAdminSession, ensureAdminInitialized } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Ensure table & default admin are ready
    await ensureAdminInitialized();

    const userResult = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, cleanEmail))
      .limit(1);

    const admin = userResult[0];

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    const isValid = verifyAdminPassword(password, admin.salt, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    // Update lastLoginAt
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(adminUsers.id, admin.id));

    // Set secure admin session cookie
    await setAdminSession(admin.email);

    return NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error("[Admin Login Error]:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during admin authentication." },
      { status: 500 }
    );
  }
}
