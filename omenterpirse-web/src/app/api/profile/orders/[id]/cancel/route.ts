import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { cookies } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const phoneNumber = cookieStore.get("auth_session")?.value;

  if (!phoneNumber) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const cleanDigits = phoneNumber.replace(/\D/g, "");
    const cleanPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : "";

    // Find user using plain select (no relational API needed)
    const userRows = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, phoneNumber),
          eq(users.phoneNumber, phoneNumber),
          ...(cleanPhone ? [eq(users.phoneNumber, cleanPhone)] : [])
        )
      )
      .limit(1);

    if (!userRows.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const user = userRows[0];
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 });
    }

    // Fetch the order (must belong to this user)
    const orderRows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
      .limit(1);

    if (!orderRows.length) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orderRows[0];

    // Only allow cancellation if order is in a pre-shipping state
    if (!["Order Placed", "Processing", "pending"].includes(order.status || "")) {
      return NextResponse.json({
        success: false,
        error: `Cannot cancel an order with status '${order.status}'.`,
      }, { status: 400 });
    }

    await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)));

    return NextResponse.json({ success: true, message: "Order cancelled successfully" });
  } catch (error: any) {
    console.error("Order Cancellation API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
