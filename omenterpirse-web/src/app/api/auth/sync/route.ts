import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, fullName, phoneNumber } = await request.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ success: false, error: "Full Name is required." }, { status: 400 });
    }

    const cleanPhone = (phoneNumber || "").toString().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: "Please provide a valid 10-digit mobile number." }, { status: 400 });
    }

    const lowerEmail = email.trim().toLowerCase();

    const userResult = await db.select()
      .from(users)
      .where(eq(users.email, lowerEmail))
      .limit(1);
    
    const existingUser = userResult[0];

    if (!existingUser) {
      await db.insert(users).values({
        email: lowerEmail,
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        role: "user",
        lastLoginAt: new Date().toISOString(),
      });
    } else {
      await db.update(users)
        .set({ 
          fullName: fullName.trim(),
          phoneNumber: cleanPhone,
          lastLoginAt: new Date().toISOString(),
        })
        .where(eq(users.email, lowerEmail));
    }

    // Set secure storefront customer session cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_session", lowerEmail, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    console.log(`[Storefront Auth] Customer session set for ${lowerEmail}`);

    return NextResponse.json({ 
      success: true, 
      message: "Customer profile registration completed successfully" 
    });

  } catch (error: any) {
    console.error(`Storefront Sync API Error:`, error);
    return NextResponse.json({ 
      success: false, 
      error: "A server error occurred during customer registration." 
    }, { status: 500 });
  }
}
