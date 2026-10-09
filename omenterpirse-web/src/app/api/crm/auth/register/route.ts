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

    const newUser = await (async () => {
      let lastErr: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // Check existing
          const existing = await db
            .select({ id: crmUsers.id })
            .from(crmUsers)
            .where(eq(crmUsers.email, normalizedEmail))
            .limit(1);

          if (existing.length > 0) {
            throw new Error("ACCOUNT_EXISTS");
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

          return inserted[0];
        } catch (err: any) {
          lastErr = err;
          if (err.message === "ACCOUNT_EXISTS") {
            throw err;
          }
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
        }
      }
      throw lastErr;
    })();

    await setCrmSession(newUser.id, newUser.email);

    return NextResponse.json({
      success: true,
      user: {
        ...newUser,
        role: "Owner",
        isOwner: true,
        canManageBusiness: true,
      },
      isOnboardingCompleted: false,
      business: null,
    });
  } catch (error: any) {
    if (error.message === "ACCOUNT_EXISTS") {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    console.error("CRM Registration error:", error);
    const userMessage = error.message?.includes("Failed query")
      ? "Database connection temporarily timed out. Please click Register again."
      : (error.message || "Failed to register account.");

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  }
}
