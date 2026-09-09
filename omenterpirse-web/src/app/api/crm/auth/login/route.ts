import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmUsers, crmBusinesses, crmTeamMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setCrmSession } from "@/lib/crmAuth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter both email and password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userResult = await db
      .select()
      .from(crmUsers)
      .where(eq(crmUsers.email, normalizedEmail))
      .limit(1);

    const user = userResult[0];
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await db
      .update(crmUsers)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(crmUsers.id, user.id));

    // Resolve business and role: either direct owner or team member
    let business = null;
    let userRole = "Owner";
    let isCompleted = Boolean(user.isOnboardingCompleted);

    const ownerBusiness = await db
      .select()
      .from(crmBusinesses)
      .where(eq(crmBusinesses.userId, user.id))
      .limit(1);

    if (ownerBusiness.length > 0) {
      business = ownerBusiness[0];
      userRole = "Owner";
      isCompleted = Boolean(user.isOnboardingCompleted && business);
    } else {
      const membership = await db
        .select()
        .from(crmTeamMembers)
        .where(eq(crmTeamMembers.userId, user.id))
        .limit(1);

      if (membership.length > 0) {
        const teamBiz = await db
          .select()
          .from(crmBusinesses)
          .where(eq(crmBusinesses.id, membership[0].businessId))
          .limit(1);

        if (teamBiz.length > 0) {
          business = teamBiz[0];
          userRole = membership[0].role;
          isCompleted = true; // Team members bypass onboarding
        }
      }
    }

    await setCrmSession(user.id, user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: userRole,
      },
      isOnboardingCompleted: isCompleted,
      business,
    });
  } catch (error: any) {
    console.error("CRM Login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log in." },
      { status: 500 }
    );
  }
}
