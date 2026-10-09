import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmUsers, crmBusinesses, crmTeamMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setCrmSession } from "@/lib/crmAuth";
import { resolveBusinessAndRole, invalidateBusinessResolverCache } from "@/lib/crmBusinessResolver";

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

    // Invalidate resolver cache on login so fresh state is loaded
    invalidateBusinessResolverCache(user.id);

    // Resolve business and role
    const { business, role, isOwner, canManageBusiness } =
      await resolveBusinessAndRole(user.id);

    const isCompleted = isOwner
      ? Boolean(user.isOnboardingCompleted && business)
      : true;

    await setCrmSession(user.id, user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: role || (isOwner ? "Owner" : "Staff"),
        isOwner,
        canManageBusiness,
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
