import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmQuotations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";
import { resolveBusinessAndRole } from "@/lib/crmBusinessResolver";

export async function GET() {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, role, user } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const quotations = await db
      .select()
      .from(crmQuotations)
      .where(eq(crmQuotations.businessId, business.id))
      .orderBy(desc(crmQuotations.id));

    return NextResponse.json({
      success: true,
      quotations,
      business,
      caller: {
        id: session.userId,
        name: user?.fullName || "User",
        role: role || "Staff",
      },
    });
  } catch (error: any) {
    console.error("Fetch quotations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch quotations." },
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

    const { business, role, user } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const body = await request.json();
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerGstin,
      quotationDate,
      validUntil,
      items,
      subtotal,
      taxTotal,
      grandTotal,
      notes,
      termsConditions,
      status,
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ success: false, error: "Customer name is required." }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "At least one item is required." }, { status: 400 });
    }

    // Generate Quotation Number
    const existingCount = await db
      .select({ id: crmQuotations.id })
      .from(crmQuotations)
      .where(eq(crmQuotations.businessId, business.id));

    const nextSeq = existingCount.length + 1;
    const year = new Date().getFullYear();
    const qNum = "QT-" + year + "-" + String(nextSeq).padStart(4, "0");

    const authorName = user?.fullName || "Team Member";
    const authorRole = role || "Staff";

    const newQuotation = await db
      .insert(crmQuotations)
      .values({
        businessId: business.id,
        quotationNumber: qNum,
        quotationDate: quotationDate || new Date().toISOString().split("T")[0],
        validUntil: validUntil || null,
        customerId: customerId ? Number(customerId) : null,
        customerName: customerName.trim(),
        customerEmail: customerEmail?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        customerAddress: customerAddress?.trim() || null,
        customerGstin: customerGstin?.trim() || null,
        items: JSON.stringify(items),
        subtotal: Number(subtotal) || 0,
        taxTotal: Number(taxTotal) || 0,
        grandTotal: Number(grandTotal) || 0,
        notes: notes?.trim() || null,
        termsConditions: termsConditions?.trim() || null,
        status: status || "Draft",
        createdByUserId: session.userId,
        createdByName: authorName,
        createdByRole: authorRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      quotation: newQuotation[0],
    });
  } catch (error: any) {
    console.error("Create quotation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create quotation." },
      { status: 500 }
    );
  }
}
