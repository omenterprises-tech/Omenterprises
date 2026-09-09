import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmUsers, crmBusinesses } from "@/db/schema";
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

    const businessResult = await db
      .select()
      .from(crmBusinesses)
      .where(eq(crmBusinesses.userId, user.id))
      .limit(1);

    const business = businessResult[0] || null;

    return NextResponse.json({
      authenticated: true,
      user,
      isOnboardingCompleted: Boolean(user.isOnboardingCompleted && business),
      business,
    });
  } catch (error: any) {
    console.error("CRM session check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
