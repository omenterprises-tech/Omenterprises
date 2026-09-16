import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check in standard storefront users table
    const shopUserResult = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const shopUser = shopUserResult[0];

    if (shopUser) {
      const cookieStore = await cookies();
      cookieStore.set("auth_session", shopUser.email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      await db
        .update(users)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(users.id, shopUser.id));

      return NextResponse.json({
        success: true,
        isNewUser: false,
        redirectTo: "/",
      });
    } else {
      // New user, registration step required
      return NextResponse.json({
        success: true,
        isNewUser: true,
      });
    }
  } catch (error: any) {
    console.error("Email login error:", error);
    return NextResponse.json({ success: false, error: "A server error occurred during login." }, { status: 500 });
  }
}
