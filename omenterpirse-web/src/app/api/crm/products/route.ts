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

    // Support batch creation
    if (Array.isArray(body.products) && body.products.length > 0) {
      const now = new Date().toISOString();
      const insertRows = [];

      for (let i = 0; i < body.products.length; i++) {
        const item = body.products[i];
        const { name, price, basePrice, gst, description, unit, hsn, category, specifications } = item;

        if (!name || !name.trim()) {
          return NextResponse.json(
            { success: false, error: `Product #${i + 1} is missing a name.` },
            { status: 400 }
          );
        }

        const rawPrice = price !== undefined && price !== null && String(price).trim() !== "" ? price : basePrice;
        if (rawPrice === undefined || rawPrice === null || String(rawPrice).trim() === "") {
          return NextResponse.json(
            { success: false, error: `Product "${name}" is missing a price.` },
            { status: 400 }
          );
        }

        const parsedPrice = parseFloat(rawPrice);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          return NextResponse.json(
            { success: false, error: `Product "${name}" has an invalid price.` },
            { status: 400 }
          );
        }

        const parsedGst = gst !== undefined && gst !== null && String(gst).trim() !== "" ? parseFloat(gst) : null;

        insertRows.push({
          name: name.trim(),
          description: description ? description.trim() : null,
          basePrice: parsedPrice,
          salePrice: parsedPrice,
          gst: parsedGst !== null && !isNaN(parsedGst) ? parsedGst : null,
          unit: unit ? unit.trim() : null,
          hsn: hsn ? hsn.trim() : null,
          category: category ? category.trim() : "General",
          specifications: specifications
            ? typeof specifications === "string"
              ? specifications
              : JSON.stringify(specifications)
            : null,
          createdAt: now,
        });
      }

      const inserted = await db.insert(products).values(insertRows).returning();

      return NextResponse.json({
        success: true,
        count: inserted.length,
        products: inserted,
      });
    }

    // Single product creation
    const { name, price, basePrice, gst, description, unit, hsn, category, specifications } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Product Name is required.", field: "name" }, { status: 400 });
    }

    const rawPrice = price !== undefined && price !== null && String(price).trim() !== "" ? price : basePrice;
    if (rawPrice === undefined || rawPrice === null || String(rawPrice).trim() === "") {
      return NextResponse.json({ success: false, error: "Price is required.", field: "price" }, { status: 400 });
    }

    const parsedPrice = parseFloat(rawPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ success: false, error: "Valid price is required.", field: "price" }, { status: 400 });
    }

    const parsedGst = gst !== undefined && gst !== null && String(gst).trim() !== "" ? parseFloat(gst) : null;

    const newProduct = await db
      .insert(products)
      .values({
        name: name.trim(),
        description: description ? description.trim() : null,
        basePrice: parsedPrice,
        salePrice: parsedPrice,
        gst: parsedGst !== null && !isNaN(parsedGst) ? parsedGst : null,
        unit: unit ? unit.trim() : null,
        hsn: hsn ? hsn.trim() : null,
        category: category ? category.trim() : "General",
        specifications: specifications
          ? typeof specifications === "string"
            ? specifications
            : JSON.stringify(specifications)
          : null,
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

export async function PUT(request: Request) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, price, basePrice, gst, description, unit, hsn, category, specifications } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Product Name is required.", field: "name" }, { status: 400 });
    }

    const rawPrice = price !== undefined && price !== null && String(price).trim() !== "" ? price : basePrice;
    if (rawPrice === undefined || rawPrice === null || String(rawPrice).trim() === "") {
      return NextResponse.json({ success: false, error: "Price is required.", field: "price" }, { status: 400 });
    }

    const parsedPrice = parseFloat(rawPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ success: false, error: "Valid price is required.", field: "price" }, { status: 400 });
    }

    const parsedGst = gst !== undefined && gst !== null && String(gst).trim() !== "" ? parseFloat(gst) : null;

    const updated = await db
      .update(products)
      .set({
        name: name.trim(),
        description: description ? description.trim() : null,
        basePrice: parsedPrice,
        salePrice: parsedPrice,
        gst: parsedGst !== null && !isNaN(parsedGst) ? parsedGst : null,
        unit: unit ? unit.trim() : null,
        hsn: hsn ? hsn.trim() : null,
        category: category ? category.trim() : "General",
        specifications: specifications
          ? typeof specifications === "string"
            ? specifications
            : JSON.stringify(specifications)
          : null,
      })
      .where(eq(products.id, parseInt(id, 10)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: updated[0],
    });
  } catch (error: any) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product." },
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
