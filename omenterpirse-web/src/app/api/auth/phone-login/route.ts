import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, fullName } = body;

    const raw = (phoneNumber || "").toString().replace(/\D/g, "");
    const cleanPhone = raw.length > 10 ? raw.slice(-10) : raw;

    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Check if user exists by phoneNumber (normalizing 10 digits or with prefixes)
    const userResult = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.phoneNumber, cleanPhone),
          eq(users.phoneNumber, "0" + cleanPhone),
          eq(users.phoneNumber, "+91" + cleanPhone),
          eq(users.phoneNumber, "91" + cleanPhone)
        )
      )
      .limit(1);

    const existingUser = userResult[0];

    // CASE 1: Full name provided -> New user registration or profile completion
    if (fullName !== undefined) {
      const cleanName = (fullName || "").trim();
      if (!cleanName) {
        return NextResponse.json(
          { success: false, error: "Please enter your name." },
          { status: 400 }
        );
      }

      let userEmail = "";
      if (existingUser) {
        userEmail = existingUser.email || `phone_${cleanPhone}@noemail.com`;
        await db
          .update(users)
          .set({
            fullName: cleanName,
            phoneNumber: cleanPhone,
            lastLoginAt: new Date().toISOString(),
          })
          .where(eq(users.id, existingUser.id));
      } else {
        userEmail = `phone_${cleanPhone}@noemail.com`;
        await db.insert(users).values({
          phoneNumber: cleanPhone,
          fullName: cleanName,
          email: userEmail,
          role: "user",
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }

      // Set storefront customer session cookie
      const cookieStore = await cookies();
      cookieStore.set("auth_session", userEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      console.log(`[Storefront Auth] Registered and logged in user ${cleanPhone} (${cleanName})`);
      return NextResponse.json({
        success: true,
        isNewUser: false,
        user: {
          fullName: cleanName,
          phoneNumber: cleanPhone,
          email: userEmail,
        },
      });
    }

    // CASE 2: Initial mobile number check
    if (existingUser && existingUser.fullName && existingUser.fullName.trim()) {
      // Existing user with a completed name -> Directly login without any OTP!
      const userEmail = existingUser.email || `phone_${cleanPhone}@noemail.com`;

      const cookieStore = await cookies();
      cookieStore.set("auth_session", userEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      // Update last login timestamp
      await db
        .update(users)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(users.id, existingUser.id));

      console.log(`[Storefront Auth] Direct login without OTP for existing user ${cleanPhone} (${existingUser.fullName})`);
      return NextResponse.json({
        success: true,
        isNewUser: false,
        user: {
          fullName: existingUser.fullName,
          phoneNumber: existingUser.phoneNumber,
          email: userEmail,
        },
      });
    } else {
      // User is new (or existing row without name) -> Prompt for user's name
      return NextResponse.json({
        success: true,
        isNewUser: true,
        phoneNumber: cleanPhone,
      });
    }
  } catch (error: any) {
    console.error("Storefront phone login error:", error);
    return NextResponse.json(
      { success: false, error: "A server error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
