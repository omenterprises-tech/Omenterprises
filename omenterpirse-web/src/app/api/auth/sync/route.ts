import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { isAdminNumber } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const { email, fullName, phoneNumber } = await request.json();

    let finalEmail = email;
    if (!finalEmail && phoneNumber) {
      finalEmail = `phone_${phoneNumber.trim()}@noemail.com`;
    }

    if (!finalEmail || !fullName) {
      return NextResponse.json({ success: false, error: "Full Name and Email or Phone Number are required" }, { status: 400 });
    }

    const lowerEmail = finalEmail.trim().toLowerCase();
    let user = null;
    const isAuthAdmin = isAdminNumber(lowerEmail);

    const userResult = await db.select()
      .from(users)
      .where(eq(users.email, lowerEmail))
      .limit(1);
    
    user = userResult[0];

    if (!user) {
      // Register new user automatically
      await db.insert(users).values({
        email: lowerEmail,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        role: isAuthAdmin ? "admin" : "user",
        lastLoginAt: new Date().toISOString(),
      });
    } else {
      // Update fullName, phoneNumber and lastLoginAt
      await db.update(users)
        .set({ 
          fullName: fullName.trim(),
          phoneNumber: phoneNumber ? phoneNumber.trim() : user.phoneNumber,
          lastLoginAt: new Date().toISOString(),
          ...(isAuthAdmin && user.role !== "admin" ? { role: "admin" } : {})
        })
        .where(eq(users.email, lowerEmail));
    }

    // Session Persistence: Set a secure cookie
    try {
      const cookieStore = await cookies();
      const cookieName = isAuthAdmin ? "admin_session" : "auth_session";
      cookieStore.set(cookieName, lowerEmail, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      console.log(`[Sync Auth] Session set for ${lowerEmail}`);
    } catch (cookieError) {
      console.error(`Cookie Error:`, cookieError);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Registration completed successfully" 
    });

  } catch (error: any) {
    console.error(`Sync API Error:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: "A server error occurred during registration." 
    }, { status: 500 });
  }
}
