import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, crmUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyPassword, setCrmSession } from "@/lib/crmAuth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user is in CRM (Business Owner or Invited Team Member)
    const crmUserResult = await db
      .select()
      .from(crmUsers)
      .where(eq(crmUsers.email, normalizedEmail))
      .limit(1);

    if (crmUserResult.length > 0) {
      const crmUser = crmUserResult[0];

      if (crmUser.passwordHash) {
        if (!password || !password.trim()) {
          return NextResponse.json({ success: false, error: "Please enter your password." }, { status: 400 });
        }
        const isValid = verifyPassword(password, crmUser.salt, crmUser.passwordHash);
        if (!isValid) {
          return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
        }
      }

      // Update last login
      await db
        .update(crmUsers)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(crmUsers.id, crmUser.id));

      await setCrmSession(crmUser.id, crmUser.email);

      // Also set the storefront auth session
      const cookieStore = await cookies();
      cookieStore.set("auth_session", crmUser.email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      const destination = crmUser.isOnboardingCompleted ? "/crm/dashboard" : "/crm/onboarding";

      return NextResponse.json({
        success: true,
        isNewUser: false,
        isCrmUser: true,
        redirectTo: destination,
      });
    }

    // 2. Check in standard shop users table
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
