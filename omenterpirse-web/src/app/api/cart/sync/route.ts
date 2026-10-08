import { NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, users, products } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const phone = cookieStore.get("auth_session")?.value;

    if (!phone) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const cleanDigits = phone.replace(/\D/g, "");
    const cleanPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : "";

    const userResult = await db.select().from(users).where(
      or(
        eq(users.email, phone),
        eq(users.phoneNumber, phone),
        ...(cleanPhone ? [eq(users.phoneNumber, cleanPhone)] : [])
      )
    ).limit(1);
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { items } = await request.json();

    // Simple sync logic: replace DB cart with local cart or merge.
    // For now, let's just clear and replace to keep it simple as a first step.
    await db.delete(cartItems).where(eq(cartItems.userId, user.id));

    if (items && items.length > 0) {
      const dbItems = [];
      for (const item of items) {
        let validProductId: number | null = null;
        if (item.productId && typeof item.productId === "number") {
          const pRow = await db.select({ id: products.id }).from(products).where(eq(products.id, item.productId)).limit(1);
          if (pRow.length > 0) {
            validProductId = item.productId;
          }
        }

        dbItems.push({
          userId: user.id,
          productId: validProductId,
          variationId: item.variationId || null,
          quantity: item.quantity || 1,
          price: item.price || 0,
        });
      }

      if (dbItems.length > 0) {
        await db.insert(cartItems).values(dbItems);
      }
    }

    return NextResponse.json({ success: true, message: "Cart synced successfully" });
  } catch (error: any) {
    console.error("Cart Sync Error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync cart" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const phone = cookieStore.get("auth_session")?.value;

    if (!phone) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await db.select().from(users).where(eq(users.email, phone)).limit(1);
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const dbCart = await db.select().from(cartItems).where(eq(cartItems.userId, user.id));

    return NextResponse.json({ success: true, items: dbCart });
  } catch (error: any) {
    console.error("Cart Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch cart" }, { status: 500 });
  }
}
