import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmUsers, crmBusinesses, crmTeamMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";

export async function GET() {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const userResult = await db
      .select({
        id: crmUsers.id,
        email: crmUsers.email,
        fullName: crmUsers.fullName,
        phoneNumber: crmUsers.phoneNumber,
        isOnboardingCompleted: crmUsers.isOnboardingCompleted,
      })
      .from(crmUsers)
      .where(eq(crmUsers.id, session.userId))
      .limit(1);

    const user = userResult[0];
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

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

    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        role: userRole,
      },
      isOnboardingCompleted: isCompleted,
      business,
    });
  } catch (error: any) {
    console.error("CRM session check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
