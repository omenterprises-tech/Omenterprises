import { NextResponse } from "next/server";
import { getCrmSession } from "@/lib/crmAuth";
import { resolveBusinessAndRole } from "@/lib/crmBusinessResolver";

export async function GET() {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const { business, role, user, isOwner, canManageBusiness } =
      await resolveBusinessAndRole(session.userId);

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    const isCompleted = isOwner
      ? Boolean(user.isOnboardingCompleted && business)
      : true; // Team members bypass onboarding

    return NextResponse.json({
      authenticated: true,
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
    console.error("CRM session check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
