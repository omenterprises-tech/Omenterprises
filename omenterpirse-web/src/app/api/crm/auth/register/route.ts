import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, setCrmSession } from "@/lib/crmAuth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, password } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ success: false, error: "Full name is required." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanPhone = (phoneNumber || "").toString().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing
    const existing = await db
      .select({ id: crmUsers.id })
      .from(crmUsers)
      .where(eq(crmUsers.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    const { salt, hash } = hashPassword(password);

    const inserted = await db
      .insert(crmUsers)
      .values({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phoneNumber: cleanPhone,
        passwordHash: hash,
        salt: salt,
        isOnboardingCompleted: false,
        createdAt: new Date().toISOString(),
      })
      .returning({
        id: crmUsers.id,
        email: crmUsers.email,
        fullName: crmUsers.fullName,
        phoneNumber: crmUsers.phoneNumber,
      });

    const newUser = inserted[0];
    await setCrmSession(newUser.id, newUser.email);

    return NextResponse.json({
      success: true,
      user: newUser,
      isOnboardingCompleted: false,
    });
  } catch (error: any) {
    console.error("CRM Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
