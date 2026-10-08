import { db } from "@/db";
import { crmBusinesses, crmTeamMembers, crmUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CachedResolution {
  result: {
    business: any;
    role: string | null;
    user: any;
    isOwner: boolean;
    canManageBusiness: boolean;
  };
  expiresAt: number;
}

// In-memory cache to eliminate repeated Turso cloud roundtrips for session resolution
const resolverCache = new Map<number, CachedResolution>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function invalidateBusinessResolverCache(userId?: number) {
  if (userId) {
    resolverCache.delete(userId);
  } else {
    resolverCache.clear();
  }
}

export async function resolveBusinessAndRole(userId: number) {
  const now = Date.now();
  const cached = resolverCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.result;
  }

  // Execute user and owner business queries in parallel to cut latency in half
  const [userResult, ownerBiz] = await Promise.all([
    db.select().from(crmUsers).where(eq(crmUsers.id, userId)).limit(1),
    db.select().from(crmBusinesses).where(eq(crmBusinesses.userId, userId)).limit(1),
  ]);

  const user = userResult[0] || null;

  if (ownerBiz.length > 0) {
    const res = {
      business: ownerBiz[0],
      role: "Owner",
      user,
      isOwner: true,
      canManageBusiness: true,
    };
    resolverCache.set(userId, { result: res, expiresAt: now + CACHE_TTL_MS });
    return res;
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
      const res = {
        business: teamBiz[0],
        role: memberRole,
        user,
        isOwner: false,
        canManageBusiness: false,
      };
      resolverCache.set(userId, { result: res, expiresAt: now + CACHE_TTL_MS });
      return res;
    }
  }

  const fallback = {
    business: null,
    role: null,
    user,
    isOwner: false,
    canManageBusiness: false,
  };
  resolverCache.set(userId, { result: fallback, expiresAt: now + 5000 });
  return fallback;
}