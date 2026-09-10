import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmQuotations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";
import { resolveBusinessAndRole } from "@/lib/crmBusinessResolver";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const { id: idParam } = await context.params;
    const quotationId = parseInt(idParam, 10);

    const quotationList = await db
      .select()
      .from(crmQuotations)
      .where(
        and(
          eq(crmQuotations.id, quotationId),
          eq(crmQuotations.businessId, business.id)
        )
      )
      .limit(1);

    if (quotationList.length === 0) {
      return NextResponse.json({ success: false, error: "Quotation not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      quotation: quotationList[0],
      business,
    });
  } catch (error: any) {
    console.error("Fetch single quotation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch quotation." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const { id: idParam } = await context.params;
    const quotationId = parseInt(idParam, 10);

    const body = await request.json();
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.status !== undefined) updateData.status = body.status;
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;
    if (body.customerAddress !== undefined) updateData.customerAddress = body.customerAddress;
    if (body.customerGstin !== undefined) updateData.customerGstin = body.customerGstin;
    if (body.customerId !== undefined) updateData.customerId = body.customerId ? Number(body.customerId) : null;
    if (body.quotationDate !== undefined) updateData.quotationDate = body.quotationDate;
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil;
    if (body.items !== undefined) updateData.items = typeof body.items === "string" ? body.items : JSON.stringify(body.items);
    if (body.subtotal !== undefined) updateData.subtotal = Number(body.subtotal) || 0;
    if (body.taxTotal !== undefined) updateData.taxTotal = Number(body.taxTotal) || 0;
    if (body.grandTotal !== undefined) updateData.grandTotal = Number(body.grandTotal) || 0;
    if (body.otherCharges !== undefined) {
      updateData.otherCharges = body.otherCharges ? (typeof body.otherCharges === "string" ? body.otherCharges : JSON.stringify(body.otherCharges)) : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.termsConditions !== undefined) updateData.termsConditions = body.termsConditions;

    const updated = await db
      .update(crmQuotations)
      .set(updateData)
      .where(
        and(
          eq(crmQuotations.id, quotationId),
          eq(crmQuotations.businessId, business.id)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      quotation: updated[0],
    });
  } catch (error: any) {
    console.error("Update quotation status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update quotation." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, role } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    if (role !== "Owner" && role !== "Admin" && role !== "Manager") {
      return NextResponse.json({ success: false, error: "Permission denied." }, { status: 403 });
    }

    const { id: idParam } = await context.params;
    const quotationId = parseInt(idParam, 10);

    await db
      .delete(crmQuotations)
      .where(
        and(
          eq(crmQuotations.id, quotationId),
          eq(crmQuotations.businessId, business.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete quotation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete quotation." },
      { status: 500 }
    );
  }
}
