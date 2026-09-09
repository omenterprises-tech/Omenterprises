import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmUsers, crmBusinesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";

export async function POST(request: Request) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      contactName,
      mobileNumber,
      email,
      addressLine1,
      addressLine2,
      logoUrl,
      signatureUrl,
      signatureType,
      dateFormat,
      currencyCode,
      currencyCountry,
      currencyPriceFormatted,
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
      logoUrl: logoUrl || null,
      signatureUrl: signatureUrl || null,
      signatureType: signatureType || null,
      dateFormat: dateFormat || "dd/MM/yyyy",
      currencyCode: currencyCode || "INR",
      currencyCountry: currencyCountry || "India",
      currencyPriceFormatted: currencyPriceFormatted || "₹999,999.12",
      updatedAt: new Date().toISOString(),
    };

    const businessRecord = await (async () => {
      let lastErr: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // Check if business already exists for this user
          const existingBusiness = await db
            .select()
            .from(crmBusinesses)
            .where(eq(crmBusinesses.userId, session.userId))
            .limit(1);

          let record;
          if (existingBusiness.length > 0) {
            const updated = await db
              .update(crmBusinesses)
              .set(payload)
              .where(eq(crmBusinesses.id, existingBusiness[0].id))
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

          // Mark user onboarding completed
          await db
            .update(crmUsers)
            .set({ isOnboardingCompleted: true })
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
    console.error("CRM onboarding error:", error);
    const userMessage = error.message?.includes("Failed query")
      ? "Database connection timed out. Please click Finish again."
      : (error.message || "Failed to save business details.");

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  }
}
