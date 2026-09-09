import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmUsers, crmBusinesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";
import { resolveBusinessAndRole } from "@/lib/crmBusinessResolver";

export async function GET() {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, role, user, canManageBusiness } = await resolveBusinessAndRole(session.userId);

    return NextResponse.json({
      success: true,
      business: business || null,
      user: user || null,
      role: role || "Owner",
      canManageBusiness,
    });
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch profile." },
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

    const { business, role, canManageBusiness } = await resolveBusinessAndRole(session.userId);
    if (!canManageBusiness) {
      return NextResponse.json(
        { success: false, error: "Only the primary business owner can update the business profile." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      businessName,
      contactName,
      mobileNumber,
      email,
      addressLine1,
      addressLine2,
      addressLine3,
      otherInfo,
      businessCategory,
      taxLabel,
      taxNumber,
      state,
      logoUrl,
      signatureUrl,
      signatureType,
    } = body;

    if (!businessName || !businessName.trim()) {
      return NextResponse.json({ success: false, error: "Business name is required." }, { status: 400 });
    }
    if (!contactName || !contactName.trim()) {
      return NextResponse.json({ success: false, error: "Contact name is required." }, { status: 400 });
    }
    if (!mobileNumber || !mobileNumber.trim()) {
      return NextResponse.json({ success: false, error: "Mobile number is required." }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const payload = {
      userId: session.userId,
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      mobileNumber: mobileNumber.trim(),
      email: email.trim(),
      addressLine1: (addressLine1 || "").trim(),
      addressLine2: (addressLine2 || "").trim(),
      addressLine3: (addressLine3 || "").trim(),
      otherInfo: (otherInfo || "").trim(),
      businessCategory: (businessCategory || "").trim() || null,
      taxLabel: (taxLabel || "GSTIN").trim(),
      taxNumber: (taxNumber || "").trim() || null,
      state: (state || "").trim() || null,
      logoUrl: logoUrl || null,
      signatureUrl: signatureUrl || null,
      signatureType: signatureType || null,
      updatedAt: new Date().toISOString(),
    };

    // Retry wrapper for resilient Turso cloud calls
    const businessRecord = await (async () => {
      let lastErr: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          let record;
          if (business) {
            const updated = await db
              .update(crmBusinesses)
              .set(payload)
              .where(eq(crmBusinesses.id, business.id))
              .returning();
            record = updated[0];
          } else {
            const inserted = await db
              .insert(crmBusinesses)
              .values({
                ...payload,
                createdAt: new Date().toISOString(),
              })
              .returning();
            record = inserted[0];
          }

          // Also update contact name & phone on user record
          await db
            .update(crmUsers)
            .set({
              fullName: contactName.trim(),
              phoneNumber: mobileNumber.trim(),
            })
            .where(eq(crmUsers.id, session.userId));

          return record;
        } catch (err: any) {
          lastErr = err;
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }
      throw lastErr;
    })();

    return NextResponse.json({
      success: true,
      business: businessRecord,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    const userMessage = error.message?.includes("Failed query")
      ? "Database connection timed out. Please try again."
      : (error.message || "Failed to update profile.");

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  }
}
