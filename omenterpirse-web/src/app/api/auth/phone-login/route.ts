import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();
    if (!phoneNumber || phoneNumber.trim().length !== 10) {
      return NextResponse.json({ success: false, error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const cleanPhone = phoneNumber.trim();

    // Check if user exists by phoneNumber
    const userResult = await db.select()
      .from(users)
      .where(eq(users.phoneNumber, cleanPhone))
      .limit(1);

    const user = userResult[0];

    if (user) {
      // User exists, set session cookie directly
      const cookieStore = await cookies();
      cookieStore.set("auth_session", user.email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      // Update last login
      await db.update(users)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(users.id, user.id));

      console.log(`[Phone Auth] Session set for ${user.email} directly`);
      return NextResponse.json({ success: true, isNewUser: false });
    } else {
      // User does not exist, registration required
      return NextResponse.json({ success: true, isNewUser: true });
    }
  } catch (error: any) {
    console.error("Phone login error:", error);
    return NextResponse.json({ success: false, error: "A server error occurred during login." }, { status: 500 });
  }
}
