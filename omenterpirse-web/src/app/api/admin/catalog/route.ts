import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, brands, brandLengths, brandModels, brandVariations } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryName = searchParams.get("category");

    // 1. Fetch Categories
    const allCategories = await db.select().from(categories).orderBy(asc(categories.displayOrder));

    // 2. Fetch Brands
    const allBrands = await db
      .select()
      .from(brands)
      .where(categoryName ? eq(brands.category, categoryName) : undefined)
      .orderBy(asc(brands.displayOrder));

    // 3. Fetch Brand Lengths
    const allLengths = await db.select().from(brandLengths).orderBy(asc(brandLengths.lengthInMeters));

    // 4. Fetch Brand Models
    const allModels = await db.select().from(brandModels).orderBy(asc(brandModels.name));

    // 5. Fetch Variations
    const allVariations = await db.select().from(brandVariations).orderBy(asc(brandVariations.thickness));

    // Nest the data hierarchically
    const nestedBrands = allBrands.map((b) => {
      // 1. Fetch direct variations (belonging directly to brand, no modelId)
      const directVariations = allVariations.filter((v) => v.brandId === b.id && !v.modelId);

      // 2. Fetch direct models (belonging directly to brand, no brandLengthId)
      const directModels = allModels
        .filter((m) => m.brandId === b.id && !m.brandLengthId)
        .map((m) => {
          const variations = allVariations.filter((v) => v.modelId === m.id);
          return { ...m, variations };
        });

      // 3. Fetch lengths (belonging to brand)
      const lengths = allLengths
        .filter((l) => l.brandId === b.id)
        .map((l) => {
          const models = allModels
            .filter((m) => m.brandLengthId === l.id)
            .map((m) => {
              const variations = allVariations.filter((v) => v.modelId === m.id);
              return { ...m, variations };
            });
          return { ...l, models };
        });

      return { ...b, lengths, directModels, directVariations };
    });

    return NextResponse.json({
      success: true,
      categories: allCategories,
      catalog: nestedBrands,
    });
  } catch (error: any) {
    console.error("Error fetching master catalog:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch master catalog" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === "brand") {
      const { name, category, imageUrl } = body;
      if (!name || !category) {
        return NextResponse.json({ error: "Brand name and Category are required" }, { status: 400 });
      }
      const [inserted] = await db
        .insert(brands)
        .values({
          name: name.trim(),
          category: category.trim(),
          imageUrl: imageUrl || null,
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

    if (type === "length") {
      const { brandId, lengthInMeters } = body;
      if (!brandId || !lengthInMeters || !String(lengthInMeters).trim()) {
        return NextResponse.json({ error: "Brand and length option are required" }, { status: 400 });
      }
      const [inserted] = await db
        .insert(brandLengths)
        .values({
          brandId: Number(brandId),
          lengthInMeters: String(lengthInMeters).trim(),
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

    if (type === "model") {
      const { brandLengthId, brandId, name, description } = body;
      if (!brandLengthId && !brandId) {
        return NextResponse.json({ error: "Brand or Length selection is required" }, { status: 400 });
      }
      if (!name) {
        return NextResponse.json({ error: "Model Name is required" }, { status: 400 });
      }
      const [inserted] = await db
        .insert(brandModels)
        .values({
          brandLengthId: brandLengthId ? Number(brandLengthId) : null,
          brandId: brandId ? Number(brandId) : null,
          name: name.trim(),
          description: description || null,
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

    if (type === "variation") {
      let { modelId, brandId, brandLengthId, thickness, colors, price, salePrice, stock } = body;
      if (!modelId && !brandId) {
        return NextResponse.json({ error: "Model or Brand selection is required" }, { status: 400 });
      }
      if (price === undefined || isNaN(Number(price))) {
        return NextResponse.json({ error: "Price is required" }, { status: 400 });
      }

      // If no modelId is provided but brandLengthId is, auto-resolve/create the "Default" model
      if (!modelId && brandLengthId) {
        const lengthIdNum = Number(brandLengthId);
        const brandIdNum = Number(brandId);
        
        // Find existing "Default" model for this length
        const existingModel = await db
          .select()
          .from(brandModels)
          .where(
            and(
              eq(brandModels.brandLengthId, lengthIdNum),
              eq(brandModels.name, "Default")
            )
          )
          .limit(1);

        if (existingModel.length > 0) {
          modelId = existingModel[0].id;
        } else {
          // Create "Default" model
          const [newModel] = await db
            .insert(brandModels)
            .values({
              brandLengthId: lengthIdNum,
              brandId: brandIdNum,
              name: "Default",
              description: "Default specifications for direct pricing",
            })
            .returning();
          modelId = newModel.id;
        }
      }

      const [inserted] = await db
        .insert(brandVariations)
        .values({
          modelId: modelId ? Number(modelId) : null,
          brandId: brandId ? Number(brandId) : null,
          thickness: thickness ? thickness.trim() : null,
          colors: Array.isArray(colors) ? JSON.stringify(colors) : (colors || "[]"),
          price: Number(price),
          salePrice: salePrice ? Number(salePrice) : null,
          stock: stock ? Number(stock) : 100,
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  } catch (error: any) {
    console.error("Error creating catalog item:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    const numId = Number(id);

    if (type === "brand") {
      await db.delete(brands).where(eq(brands.id, numId));
    } else if (type === "length") {
      await db.delete(brandLengths).where(eq(brandLengths.id, numId));
    } else if (type === "model") {
      await db.delete(brandModels).where(eq(brandModels.id, numId));
    } else if (type === "variation") {
      await db.delete(brandVariations).where(eq(brandVariations.id, numId));
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting catalog item:", error);
    return NextResponse.json({ success: false, error: "Failed to delete item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    const numId = Number(id);

    if (type === "brand") {
      const { name, category, imageUrl } = body;
      if (!name || !category) {
        return NextResponse.json({ error: "Brand name and Category are required" }, { status: 400 });
      }
      const [updated] = await db
        .update(brands)
        .set({
          name: name.trim(),
          category: category.trim(),
          imageUrl: imageUrl || null,
        })
        .where(eq(brands.id, numId))
        .returning();
      return NextResponse.json({ success: true, data: updated });
    }

    if (type === "length") {
      const { lengthInMeters } = body;
      if (!lengthInMeters || !String(lengthInMeters).trim()) {
        return NextResponse.json({ error: "Length option is required" }, { status: 400 });
      }
      const [updated] = await db
        .update(brandLengths)
        .set({
          lengthInMeters: String(lengthInMeters).trim(),
        })
        .where(eq(brandLengths.id, numId))
        .returning();
      return NextResponse.json({ success: true, data: updated });
    }

    if (type === "model") {
      const { name, description } = body;
      if (!name) {
        return NextResponse.json({ error: "Model Name is required" }, { status: 400 });
      }
      const [updated] = await db
        .update(brandModels)
        .set({
          name: name.trim(),
          description: description || null,
        })
        .where(eq(brandModels.id, numId))
        .returning();
      return NextResponse.json({ success: true, data: updated });
    }

    if (type === "variation") {
      const { thickness, colors, price, salePrice, stock } = body;
      if (price === undefined || isNaN(Number(price))) {
        return NextResponse.json({ error: "Price is required" }, { status: 400 });
      }
      const [updated] = await db
        .update(brandVariations)
        .set({
          thickness: thickness ? thickness.trim() : null,
          colors: Array.isArray(colors) ? JSON.stringify(colors) : (colors || "[]"),
          price: Number(price),
          salePrice: salePrice ? Number(salePrice) : null,
          stock: stock ? Number(stock) : 100,
        })
        .where(eq(brandVariations.id, numId))
        .returning();
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating catalog item:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update item" }, { status: 500 });
  }
}
