import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getCrmSession } from "@/lib/crmAuth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.id));

    return NextResponse.json({
      success: true,
      products: allProducts,
    });
  } catch (error: any) {
    console.error("Fetch products error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products." },
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

    const body = await request.json();
    const { name, description, basePrice, category } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Product name is required." }, { status: 400 });
    }

    const price = parseFloat(basePrice);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ success: false, error: "Valid price is required." }, { status: 400 });
    }

    const newProduct = await db
      .insert(products)
      .values({
        name: name.trim(),
        description: description ? description.trim() : null,
        basePrice: price,
        salePrice: price,
        category: category ? category.trim() : "General",
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      product: newProduct[0],
    });
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product." },
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

    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, parseInt(idParam, 10)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete product." },
      { status: 500 }
    );
  }
}
