import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmBusinesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";
import { resolveBusinessAndRole } from "@/lib/crmBusinessResolver";

export async function GET() {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      terms: business.otherInfo || "",
    });
  } catch (error: any) {
    console.error("Fetch terms error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch terms." },
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

    // Both owner and team members can edit terms
    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const body = await request.json();
    let cleanTerms = "";

    if (Array.isArray(body.points)) {
      cleanTerms = body.points
        .map((p: any, idx: number) => {
          const raw = typeof p === "string" ? p.trim() : (p?.text || "").trim();
          if (!raw) return "";
          // Strip any duplicate leading numbers
          const clean = raw.replace(/^(\d+[\.\)]\s*|[•\-\*]\s*)/, "").trim();
          return clean ? `${idx + 1}. ${clean}` : "";
        })
        .filter(Boolean)
        .join("\n");
    } else if (typeof body.terms === "string") {
      cleanTerms = body.terms.trim();
    }

    await db
      .update(crmBusinesses)
      .set({
        otherInfo: cleanTerms,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(crmBusinesses.id, business.id));

    return NextResponse.json({
      success: true,
      terms: cleanTerms,
    });
  } catch (error: any) {
    console.error("Save terms error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save terms." },
      { status: 500 }
    );
  }
}
