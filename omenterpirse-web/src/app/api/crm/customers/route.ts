import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmCustomers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
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

    const customers = await db
      .select()
      .from(crmCustomers)
      .where(eq(crmCustomers.businessId, business.id))
      .orderBy(desc(crmCustomers.id));

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error: any) {
    console.error("Fetch customers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customers." },
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

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const body = await request.json();
    const { name, companyName, email, phone, address, city, state, pincode, gstin } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Customer name is required." }, { status: 400 });
    }

    const newCustomer = await db
      .insert(crmCustomers)
      .values({
        businessId: business.id,
        name: name.trim(),
        companyName: companyName?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        gstin: gstin?.trim() || null,
        createdByUserId: session.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      customer: newCustomer[0],
    });
  } catch (error: any) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer." },
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

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, companyName, email, phone, address, city, state, pincode, gstin } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Customer ID is required." }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Customer name is required." }, { status: 400 });
    }

    const customerId = parseInt(id, 10);
    const updated = await db
      .update(crmCustomers)
      .set({
        name: name.trim(),
        companyName: companyName ? companyName.trim() : null,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        pincode: pincode ? pincode.trim() : null,
        gstin: gstin ? gstin.trim() : null,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(crmCustomers.id, customerId),
          eq(crmCustomers.businessId, business.id)
        )
      )
      .returning();

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer: updated[0],
    });
  } catch (error: any) {
    console.error("Update customer error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update customer." },
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

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ success: false, error: "Customer ID is required." }, { status: 400 });
    }

    const id = parseInt(idParam, 10);
    await db
      .delete(crmCustomers)
      .where(
        and(
          eq(crmCustomers.id, id),
          eq(crmCustomers.businessId, business.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete customer." },
      { status: 500 }
    );
  }
}
