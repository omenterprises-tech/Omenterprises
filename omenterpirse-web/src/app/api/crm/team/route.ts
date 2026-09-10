import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmUsers, crmBusinesses, crmTeamMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCrmSession, hashPassword } from "@/lib/crmAuth";
import { resolveBusinessAndRole } from "@/lib/crmBusinessResolver";

export async function GET() {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, role, isOwner } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    // 1. Fetch Owner record
    const ownerUser = await db
      .select({
        id: crmUsers.id,
        fullName: crmUsers.fullName,
        email: crmUsers.email,
        phoneNumber: crmUsers.phoneNumber,
        createdAt: crmUsers.createdAt,
      })
      .from(crmUsers)
      .where(eq(crmUsers.id, business.userId))
      .limit(1);

    const members: any[] = [];

    if (ownerUser.length > 0) {
      members.push({
        id: 0,
        userId: ownerUser[0].id,
        name: ownerUser[0].fullName,
        email: ownerUser[0].email,
        phone: ownerUser[0].phoneNumber,
        role: "Owner (Primary)",
        status: "Active",
        isOwner: true,
      });
    }

    // 2. Fetch all team members for this business
    const teamList = await db
      .select({
        id: crmTeamMembers.id,
        userId: crmTeamMembers.userId,
        role: crmTeamMembers.role,
        status: crmTeamMembers.status,
        createdAt: crmTeamMembers.createdAt,
        name: crmUsers.fullName,
        email: crmUsers.email,
        phone: crmUsers.phoneNumber,
      })
      .from(crmTeamMembers)
      .innerJoin(crmUsers, eq(crmTeamMembers.userId, crmUsers.id))
      .where(eq(crmTeamMembers.businessId, business.id));

    for (const t of teamList) {
      members.push({
        id: t.id,
        userId: t.userId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        role: t.role,
        status: t.status,
        isOwner: false,
      });
    }

    return NextResponse.json({
      success: true,
      members,
      callerRole: role,
      canManageTeam: Boolean(isOwner), // Team members have view-only access!
    });
  } catch (error: any) {
    console.error("Fetch team error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch team members." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, isOwner } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    // Strictly enforce view-only access for team members: only the primary owner can add members
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Team members have view-only access to team details. Only the business owner can add team members." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, email, password, role: memberRole, phoneNumber } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ success: false, error: "Member full name is required." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !/^[^s@]+@[^s@]+.[^s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const assignedRole = ["Admin", "Manager", "Staff"].includes(memberRole) ? memberRole : "Staff";
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(crmUsers)
      .where(eq(crmUsers.email, normalizedEmail))
      .limit(1);

    let memberUserId: number;

    if (existingUsers.length > 0) {
      memberUserId = existingUsers[0].id;

      // Check if already in this business team
      const existingMember = await db
        .select()
        .from(crmTeamMembers)
        .where(
          and(
            eq(crmTeamMembers.businessId, business.id),
            eq(crmTeamMembers.userId, memberUserId)
          )
        )
        .limit(1);

      if (existingMember.length > 0 || memberUserId === business.userId) {
        return NextResponse.json(
          { success: false, error: "A team member with this email already belongs to your business." },
          { status: 409 }
        );
      }

      // Update their password if admin explicitly sets it
      const { salt, hash } = hashPassword(password);
      await db
        .update(crmUsers)
        .set({
          fullName: fullName.trim(),
          passwordHash: hash,
          salt: salt,
          isOnboardingCompleted: true,
        })
        .where(eq(crmUsers.id, memberUserId));
    } else {
      // Create new crm_user with email and password
      const { salt, hash } = hashPassword(password);
      const cleanPhone = (phoneNumber || "").toString().replace(/\D/g, "");

      const createdUser = await db
        .insert(crmUsers)
        .values({
          fullName: fullName.trim(),
          email: normalizedEmail,
          phoneNumber: cleanPhone || "0000000000",
          passwordHash: hash,
          salt: salt,
          isOnboardingCompleted: true,
          createdAt: new Date().toISOString(),
        })
        .returning({ id: crmUsers.id });

      memberUserId = createdUser[0].id;
    }

    // Insert into crm_team_members
    const newMemberRecord = await db
      .insert(crmTeamMembers)
      .values({
        businessId: business.id,
        userId: memberUserId,
        role: assignedRole,
        status: "Active",
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      member: {
        id: newMemberRecord[0].id,
        userId: memberUserId,
        name: fullName.trim(),
        email: normalizedEmail,
        role: assignedRole,
        status: "Active",
        isOwner: false,
      },
    });
  } catch (error: any) {
    console.error("Create team member error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create team member." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, isOwner } = await resolveBusinessAndRole(session.userId);
    if (!business || !isOwner) {
      return NextResponse.json(
        { success: false, error: "Team members have view-only access to team details. Only the business owner can remove team members." },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const memberIdParam = url.searchParams.get("id");
    if (!memberIdParam) {
      return NextResponse.json({ success: false, error: "Member ID is required." }, { status: 400 });
    }

    const memberId = parseInt(memberIdParam, 10);
    await db
      .delete(crmTeamMembers)
      .where(
        and(
          eq(crmTeamMembers.id, memberId),
          eq(crmTeamMembers.businessId, business.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete team member error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove team member." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, isOwner } = await resolveBusinessAndRole(session.userId);
    if (!business || !isOwner) {
      return NextResponse.json(
        { success: false, error: "Team members have view-only access to team details. Only the business owner can edit team members." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, fullName, role: memberRole, phoneNumber, password } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Team member ID is required." }, { status: 400 });
    }

    const memberId = parseInt(id, 10);
    const memberRows = await db
      .select()
      .from(crmTeamMembers)
      .where(
        and(
          eq(crmTeamMembers.id, memberId),
          eq(crmTeamMembers.businessId, business.id)
        )
      )
      .limit(1);

    if (memberRows.length === 0) {
      return NextResponse.json({ success: false, error: "Team member not found." }, { status: 404 });
    }

    const member = memberRows[0];
    const userUpdateFields: any = {};

    if (fullName && typeof fullName === "string" && fullName.trim()) {
      userUpdateFields.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      const cleanPhone = String(phoneNumber).replace(/\D/g, "");
      userUpdateFields.phoneNumber = cleanPhone || "0000000000";
    }

    if (password && typeof password === "string") {
      if (password.trim().length > 0) {
        if (password.trim().length < 6) {
          return NextResponse.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
        }
        const { salt, hash } = hashPassword(password.trim());
        userUpdateFields.passwordHash = hash;
        userUpdateFields.salt = salt;
      }
    }

    if (Object.keys(userUpdateFields).length > 0) {
      await db
        .update(crmUsers)
        .set(userUpdateFields)
        .where(eq(crmUsers.id, member.userId));
    }

    let updatedRole = member.role;
    if (memberRole && ["Admin", "Manager", "Staff"].includes(memberRole)) {
      updatedRole = memberRole;
      await db
        .update(crmTeamMembers)
        .set({ role: updatedRole })
        .where(eq(crmTeamMembers.id, member.id));
    }

    // Fetch updated user info to return
    const updatedUserRows = await db
      .select()
      .from(crmUsers)
      .where(eq(crmUsers.id, member.userId))
      .limit(1);

    const u = updatedUserRows[0];

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        userId: member.userId,
        name: u?.fullName || "Team Member",
        email: u?.email || "",
        phone: u?.phoneNumber || "",
        role: updatedRole,
        status: member.status,
        isOwner: false,
      },
    });
  } catch (error: any) {
    console.error("Update team member error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update team member." },
      { status: 500 }
    );
  }
}

