import { db } from "@/db";
import { crmBusinesses, crmTeamMembers, crmUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function resolveBusinessAndRole(userId: number) {
  const userResult = await db
    .select()
    .from(crmUsers)
    .where(eq(crmUsers.id, userId))
    .limit(1);

  const user = userResult[0] || null;

  const ownerBiz = await db
    .select()
    .from(crmBusinesses)
    .where(eq(crmBusinesses.userId, userId))
    .limit(1);

  if (ownerBiz.length > 0) {
    return {
      business: ownerBiz[0],
      role: "Owner",
      user,
      isOwner: true,
      canManageBusiness: true,
    };
  }

  const membership = await db
    .select()
    .from(crmTeamMembers)
    .where(eq(crmTeamMembers.userId, userId))
    .limit(1);

  if (membership.length > 0) {
    const teamBiz = await db
      .select()
      .from(crmBusinesses)
      .where(eq(crmBusinesses.id, membership[0].businessId))
      .limit(1);

    if (teamBiz.length > 0) {
      const memberRole = membership[0].role || "Staff";
      return {
        business: teamBiz[0],
        role: memberRole,
        user,
        isOwner: false,
        canManageBusiness: false,
      };
    }
  }

  return {
    business: null,
    role: null,
    user,
    isOwner: false,
    canManageBusiness: false,
  };
}