import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users, productVariations, brandVariations, products } from "@/db/schema";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import Razorpay from "razorpay";
import nodemailer from "nodemailer";

// SMTP Transporter Config for Admin Notifications
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

class OutOfStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutOfStockError';
  }
}

export async function POST(req: Request) {
  try {
    const { 
      items, 
      totalAmount, 
      paymentMethod, 
      shippingAddress,
      shippingDetails,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature 
    } = await req.json();

    const cookieStore = await cookies();
    const phoneNumber = cookieStore.get("auth_session")?.value;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Verify Razorpay Signature
    if (paymentMethod === "online_prepaid") {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return NextResponse.json({ success: false, error: "Payment details missing" }, { status: 400 });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
      }
    }

    // Find user
    const userRows = await db.select().from(users).where(eq(users.email, phoneNumber)).limit(1);
    if (!userRows.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const user = userRows[0];

    // Append new address to user's saved addresses
    if (shippingAddress) {
      let addresses: string[] = [];
      if (user.address) {
        try {
          addresses = JSON.parse(user.address);
          if (!Array.isArray(addresses)) addresses = [user.address];
        } catch {
          addresses = [user.address];
        }
      }
      if (!addresses.includes(shippingAddress)) {
        addresses.push(shippingAddress);
        await db.update(users)
          .set({ address: JSON.stringify(addresses) })
          .where(eq(users.id, user.id));
      }
    }

    // --------------------------------------------------------
    // Stock Validation & Order Creation inside a DB Transaction
    // --------------------------------------------------------
    try {
      const orderId = await db.transaction(async (tx) => {
        // 1. Stock Validation
        for (const item of items) {
          let stockAvailable = 100;
          let matchedStockFound = false;

          // Try legacy productVariations first
          if (item.productId) {
            const variationRows = await tx.select().from(productVariations)
              .where(and(eq(productVariations.productId, item.productId), eq(productVariations.size, item.size)));

            const v = item.color 
              ? variationRows.find(row => row.color === item.color)
              : variationRows[0];

            if (v) {
              matchedStockFound = true;
              const pastOrderItems = await tx.select({
                quantity: orderItems.quantity,
                status: orders.status,
                color: orderItems.color
              }).from(orderItems)
                .leftJoin(orders, eq(orderItems.orderId, orders.id))
                .where(and(
                  eq(orderItems.productId, item.productId),
                  eq(orderItems.size, item.size)
                ));

              const totalConsumed = pastOrderItems
                .filter(oi => {
                  const matchesColor = item.color ? oi.color === item.color : !oi.color;
                  return matchesColor && oi.status && ["order placed", "processing", "shipped", "in transit", "out for delivery", "delivered"].includes(oi.status.toLowerCase());
                })
                .reduce((sum, oi) => sum + (oi.quantity || 0), 0);

              stockAvailable = Math.max(0, v.stock - totalConsumed);
            }
          }

          // Try brandVariations if not matched in productVariations
          if (!matchedStockFound && item.productId) {
            const bvRows = await tx.select().from(brandVariations)
              .where(eq(brandVariations.id, item.productId));

            if (bvRows.length > 0) {
              matchedStockFound = true;
              stockAvailable = bvRows[0].stock || 100;
            }
          }

          if (matchedStockFound && stockAvailable < item.quantity) {
            throw new OutOfStockError(`Insufficient stock. Only ${stockAvailable} left for ${item.name} (${item.size || ''}).`);
          }
        }

        const isPrepaid = paymentMethod === "online_prepaid";

        // 2. Create Order
        const [newOrder] = await tx.insert(orders).values({
          userId: user.id,
          totalAmount: totalAmount,
          status: "Order Placed", 
          shippingAddress: shippingAddress,
          shippingDetails: shippingDetails,
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          paymentMode: paymentMethod === "quote" ? "Quote Request" : (paymentMethod === "whatsapp_order" ? "WhatsApp Order" : (isPrepaid ? "Prepaid" : "WhatsApp Order")),
          paymentStatus: isPrepaid ? "PAID" : null,
          amountPaid: isPrepaid ? totalAmount : null,
          razorpayPaymentId: isPrepaid ? razorpay_payment_id : null,
          createdAt: new Date().toISOString(),
        }).returning();

        // 3. Create Order Items
        for (const item of items) {
          let variationIdVal: number | null = null;
          let validProductIdVal: number | null = null;

          if (item.productId && typeof item.productId === "number") {
            const pCheck = await tx.select({ id: products.id }).from(products).where(eq(products.id, item.productId)).limit(1);
            if (pCheck.length > 0) {
              validProductIdVal = item.productId;
            }

            const vRows = await tx.select().from(productVariations)
              .where(and(eq(productVariations.productId, item.productId), eq(productVariations.size, item.size)));

            const matchedV = item.color 
              ? vRows.find(row => row.color === item.color)
              : vRows[0];

            if (matchedV) {
              variationIdVal = matchedV.id;
            }
          }

          await tx.insert(orderItems).values({
            orderId: newOrder.id,
            productId: validProductIdVal,
            variationId: variationIdVal,
            quantity: item.quantity,
            price: item.price,
            size: item.size || null,
            color: item.color || null,
            customizations: item.customizations ? JSON.stringify(item.customizations) : null,
          });
        }

        return newOrder.id;
      });

      // Send email to admin in background
      try {
        const mailOptions = {
          from: `"OM Enterprises Portal" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || "support.omenterprises@gmail.com",
          subject: `New Order Received - Order #${orderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #0D47A1; text-align: center;">New Order Received!</h2>
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
              <p>Hello Admin,</p>
              <p>A customer has placed a new order on <strong>OM Enterprises</strong>.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #${orderId}</p>
                <p style="margin: 0 0 8px 0;"><strong>Total Amount:</strong> ₹${totalAmount.toLocaleString()}</p>
                <p style="margin: 0 0 8px 0;"><strong>Payment Mode:</strong> ${paymentMethod === "quote" ? "Quote Request" : (paymentMethod === "whatsapp_order" ? "WhatsApp Order" : "Online Prepaid")}</p>
                <p style="margin: 0 0 8px 0;"><strong>Customer Email:</strong> ${user.email}</p>
              </div>
              
              <p style="margin-top: 20px;">Please check the Admin Panel to manage this order and see more details.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/admin/orders" style="background-color: #FF9800; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Go to Admin Panel</a>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
              <p style="font-size: 11px; color: #888888; text-align: center;">This is an automated notification from the OM Enterprises Portal.</p>
            </div>
          `,
        };

        transporter.sendMail(mailOptions).then((info) => {
          console.log(`[Email] Admin notification sent: ${info.messageId}`);
        }).catch((err) => {
          console.error("[Email] Transporter error sending admin notification:", err);
        });
      } catch (emailErr) {
        console.error("[Email] Exception sending admin notification:", emailErr);
      }

      return NextResponse.json({ success: true, orderId });

    } catch (transactionError: any) {
      if (transactionError instanceof OutOfStockError || transactionError.name === 'OutOfStockError') {
        // Automatic Refund Logic if paid online
        if (paymentMethod === "online_prepaid" && razorpay_payment_id) {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
          });

          try {
            await razorpay.payments.refund(razorpay_payment_id, {
              amount: Math.round(totalAmount * 100),
              notes: { reason: "Out of stock race condition - auto refund" }
            });
            
            return NextResponse.json({ 
              success: false, 
              error: "Some items went out of stock just as you were paying. Your payment has been automatically refunded.",
              refundInitiated: true 
            }, { status: 400 });
            
          } catch (refundError) {
            console.error("Razorpay Auto-Refund failed:", refundError);
            return NextResponse.json({ 
              success: false, 
              error: "Items went out of stock, but the automatic refund failed. Please contact support.",
              refundInitiated: false 
            }, { status: 500 });
          }
        }
        
        // Not online prepaid (e.g., COD), or no payment ID yet
        return NextResponse.json({ success: false, error: transactionError.message }, { status: 400 });
      }
      
      throw transactionError; // Re-throw to outer catch block if it's a generic DB error
    }

  } catch (error: any) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
