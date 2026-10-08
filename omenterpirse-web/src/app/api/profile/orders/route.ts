import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const phoneNumber = cookieStore.get("auth_session")?.value;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Find user
    const cleanDigits = phoneNumber.replace(/\D/g, "");
    const cleanPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : "";

    const userRows = await db.select().from(users).where(
      or(
        eq(users.email, phoneNumber),
        eq(users.phoneNumber, phoneNumber),
        ...(cleanPhone ? [eq(users.phoneNumber, cleanPhone)] : [])
      )
    ).limit(1);
    if (!userRows.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const user = userRows[0];

    const userOrders = await db.select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      orderStatus: orders.orderStatus,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
      paymentId: orders.paymentId,
      cancelReason: orders.cancelReason,
      awbNumber: orders.awbNumber,
      shippingDetails: orders.shippingDetails,
      shippingStatus: orders.shippingStatus,
    })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

    // For each order, fetch items
    const ordersWithItems = await Promise.all(userOrders.map(async (order) => {
      const items = await db.select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: products.name,
        productImage: products.images,
        quantity: orderItems.quantity,
        price: orderItems.price,
        size: orderItems.size,
        color: orderItems.color,
        customizations: orderItems.customizations,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

      return {
        ...order,
        customerPhone: user.phoneNumber,
        items: items.map(item => {
          let imageUrl = "/placeholder-product.png";
          try {
            if (item.productImage) {
              const parsed = typeof item.productImage === 'string' ? JSON.parse(item.productImage) : item.productImage;
              if (Array.isArray(parsed) && parsed.length > 0) {
                imageUrl = parsed[0];
              }
            }
          } catch (e) {
            console.error("Error parsing product images for item:", item.id, e);
          }
          
          return {
            ...item,
            productImage: imageUrl,
            customizations: item.customizations ? JSON.parse(item.customizations) : null
          };
        })
      };
    }));

    return NextResponse.json({ success: true, data: ordersWithItems });
  } catch (error: any) {
    console.error("User Orders API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
