import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, brands, brandLengths, brandModels, brandVariations, catalogNodes } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryName = searchParams.get("category");

    // 1. Fetch Categories
    const allCategories = await db.select().from(categories).orderBy(asc(categories.displayOrder));

    // 2. Fetch all dynamic catalog nodes
    const allNodes = await db
      .select()
      .from(catalogNodes)
      .orderBy(asc(catalogNodes.displayOrder), asc(catalogNodes.id));

    // 3. Legacy Brands & Lengths (for backward compatibility)
    const allBrands = await db
      .select()
      .from(brands)
      .where(categoryName ? eq(brands.category, categoryName) : undefined)
      .orderBy(asc(brands.displayOrder));

    const allLengths = await db.select().from(brandLengths).orderBy(asc(brandLengths.lengthInMeters));
    const allModels = await db.select().from(brandModels).orderBy(asc(brandModels.name));
    const allVariations = await db.select().from(brandVariations).orderBy(asc(brandVariations.thickness));

    // Nest the data hierarchically
    const nestedBrands = allBrands.map((b) => {
      const directVariations = allVariations.filter((v) => v.brandId === b.id && !v.modelId);
      const directModels = allModels
        .filter((m) => m.brandId === b.id && !m.brandLengthId)
        .map((m) => {
          const variations = allVariations.filter((v) => v.modelId === m.id);
          return { ...m, variations };
        });

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
      nodes: allNodes,
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

    if (type === "category") {
      const { name, levelNames, imageUrl } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Category name is required" }, { status: 400 });
      }
      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const [inserted] = await db
        .insert(categories)
        .values({
          name: name.trim(),
          slug,
          imageUrl: imageUrl || null,
          levelNames: levelNames ? (typeof levelNames === "string" ? levelNames : JSON.stringify(levelNames)) : null,
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

    if (type === "node") {
      const { categoryId, parentId, levelIndex, name, imageUrl, description, price, salePrice, stock, colors, specKey } = body;
      if (!name || !String(name).trim() || categoryId === undefined) {
        return NextResponse.json({ error: "Name and Category ID are required" }, { status: 400 });
      }

      const [inserted] = await db
        .insert(catalogNodes)
        .values({
          categoryId: Number(categoryId),
          parentId: parentId ? Number(parentId) : null,
          levelIndex: Number(levelIndex) || 0,
          name: String(name).trim(),
          imageUrl: imageUrl || null,
          description: description || null,
          price: price !== undefined && price !== null && price !== "" ? Number(price) : null,
          salePrice: salePrice !== undefined && salePrice !== null && salePrice !== "" ? Number(salePrice) : null,
          stock: stock !== undefined && stock !== null ? Number(stock) : 100,
          colors: Array.isArray(colors) ? JSON.stringify(colors) : (colors || "[]"),
          specKey: specKey || null,
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

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

    if (type === "node") {
      const deleteRecursive = async (nodeId: number) => {
        const children = await db.select({ id: catalogNodes.id }).from(catalogNodes).where(eq(catalogNodes.parentId, nodeId));
        for (const child of children) {
          await deleteRecursive(child.id);
        }
        await db.delete(catalogNodes).where(eq(catalogNodes.id, nodeId));
      };
      await deleteRecursive(numId);
    } else if (type === "category") {
      await db.delete(categories).where(eq(categories.id, numId));
    } else if (type === "brand") {
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

    if (type === "node") {
      const { name, imageUrl, description, price, salePrice, stock, colors, specKey } = body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = String(name).trim();
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price !== "" && price !== null ? Number(price) : null;
      if (salePrice !== undefined) updateData.salePrice = salePrice !== "" && salePrice !== null ? Number(salePrice) : null;
      if (stock !== undefined) updateData.stock = Number(stock) || 100;
      if (colors !== undefined) updateData.colors = Array.isArray(colors) ? JSON.stringify(colors) : (colors || "[]");
      if (specKey !== undefined) updateData.specKey = specKey;

      const [updated] = await db
        .update(catalogNodes)
        .set(updateData)
        .where(eq(catalogNodes.id, numId))
        .returning();
      return NextResponse.json({ success: true, data: updated });
    }

    if (type === "category") {
      const { name, levelNames, imageUrl } = body;
      const updateData: any = {};
      if (name && name.trim()) {
        updateData.name = name.trim();
        updateData.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      }
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (levelNames !== undefined) {
        updateData.levelNames = typeof levelNames === "string" ? levelNames : JSON.stringify(levelNames);
      }
      const [updated] = await db
        .update(categories)
        .set(updateData)
        .where(eq(categories.id, numId))
        .returning();
      return NextResponse.json({ success: true, data: updated });
    }

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
