import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface GeneratedProductItem {
  name: string;
  category?: string | null;
  basePrice: number;
  salePrice?: number | null;
  unit?: string | null;
  hsn?: string | null;
  gst?: number | null;
  description?: string | null;
  specifications?: { key: string; value: string }[] | null;
  tags?: string | null;
  size?: string | null;
  color?: string | null;
  stock?: number | null;
  brand?: string | null;
  imageUrl?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: GeneratedProductItem[] = body.products;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No products provided to generate." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let createdCount = 0;
    let updatedCount = 0;
    const processedProducts: any[] = [];

    // Process in batches / transaction
    await db.transaction(async (tx) => {
      for (const item of items) {
        const cleanName = item.name?.trim();
        if (!cleanName) continue;

        const rawBasePrice = Number(item.basePrice);
        const parsedBasePrice = isNaN(rawBasePrice) ? 0 : rawBasePrice;
        const rawSalePrice = item.salePrice !== undefined && item.salePrice !== null ? Number(item.salePrice) : parsedBasePrice;
        const parsedSalePrice = isNaN(rawSalePrice) ? parsedBasePrice : rawSalePrice;
        const parsedGst = item.gst !== undefined && item.gst !== null ? Number(item.gst) : 18;
        const parsedStock = item.stock !== undefined && item.stock !== null ? Number(item.stock) : 100;

        const specsString = item.specifications
          ? typeof item.specifications === "string"
            ? item.specifications
            : JSON.stringify(item.specifications)
          : null;

        // Check if an individual product with this exact name already exists
        const existing = await tx
          .select()
          .from(products)
          .where(eq(products.name, cleanName))
          .limit(1);

        if (existing.length > 0) {
          // Update existing product
          const existingProduct = existing[0];
          await tx
            .update(products)
            .set({
              basePrice: parsedBasePrice,
              salePrice: parsedSalePrice,
              category: item.category || existingProduct.category || "Electrical Wires",
              unit: item.unit || existingProduct.unit || "COILS",
              hsn: item.hsn || existingProduct.hsn || "8544",
              gst: !isNaN(parsedGst) ? parsedGst : existingProduct.gst,
              specifications: specsString || existingProduct.specifications,
              tags: item.tags || existingProduct.tags,
            })
            .where(eq(products.id, existingProduct.id));

          // Also update or insert variation
          const existingVariation = await tx
            .select()
            .from(productVariations)
            .where(eq(productVariations.productId, existingProduct.id))
            .limit(1);

          if (existingVariation.length > 0) {
            await tx
              .update(productVariations)
              .set({
                mrp: parsedBasePrice,
                salePrice: parsedSalePrice,
                size: item.size || existingVariation[0].size || "Standard",
                color: item.color || existingVariation[0].color,
                stock: parsedStock,
              })
              .where(eq(productVariations.id, existingVariation[0].id));
          } else {
            await tx.insert(productVariations).values({
              productId: existingProduct.id,
              size: item.size || "Standard",
              stock: parsedStock,
              sku: `PROD-${existingProduct.id}`,
              mrp: parsedBasePrice,
              salePrice: parsedSalePrice,
              color: item.color || null,
            });
          }

          updatedCount++;
          processedProducts.push({ id: existingProduct.id, name: cleanName, action: "updated" });
        } else {
          // Create new individual product
          const [newProduct] = await tx
            .insert(products)
            .values({
              name: cleanName,
              description: item.description || `${cleanName} - Premium Quality ISI Certified`,
              basePrice: parsedBasePrice,
              salePrice: parsedSalePrice,
              images: item.imageUrl ? JSON.stringify([item.imageUrl]) : JSON.stringify([]),
              category: item.category || "Electrical Wires",
              tags: item.tags || null,
              isFeatured: false,
              specifications: specsString,
              gst: !isNaN(parsedGst) ? parsedGst : 18,
              unit: item.unit || "COILS",
              hsn: item.hsn || "8544",
              createdAt: now,
            })
            .returning();

          // Add individual variation
          await tx.insert(productVariations).values({
            productId: newProduct.id,
            size: item.size || "Standard",
            stock: parsedStock,
            sku: `PROD-${newProduct.id}`,
            mrp: parsedBasePrice,
            salePrice: parsedSalePrice,
            color: item.color || null,
          });

          createdCount++;
          processedProducts.push({ id: newProduct.id, name: cleanName, action: "created" });
        }
      }
    });

    try {
      revalidatePath("/admin/products");
      revalidatePath("/crm/products");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${items.length} individual products (${createdCount} created, ${updatedCount} updated).`,
      createdCount,
      updatedCount,
      totalCount: items.length,
      products: processedProducts,
    });
  } catch (error: any) {
    console.error("Error generating individual products:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate individual products." },
      { status: 500 }
    );
  }
}
