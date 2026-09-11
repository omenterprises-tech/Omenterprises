import { NextResponse } from "next/server";
import { db } from "@/db";
import { catalogNodes, brands, brandLengths, brandModels, brandVariations } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

// Recursive helper to find all descendant IDs
async function getAllDescendantIds(nodeId: number): Promise<number[]> {
  const result: number[] = [nodeId];
  const children = await db
    .select({ id: catalogNodes.id })
    .from(catalogNodes)
    .where(eq(catalogNodes.parentId, nodeId));

  for (const child of children) {
    const subDescendants = await getAllDescendantIds(child.id);
    result.push(...subDescendants);
  }
  return result;
}

export async function GET() {
  try {
    let allNodes = await db
      .select()
      .from(catalogNodes)
      .orderBy(asc(catalogNodes.displayOrder), asc(catalogNodes.id));

    // Auto-migration: If catalogNodes is completely empty, auto-seed from existing catalog tables
    if (allNodes.length === 0) {
      const existingBrands = await db.select().from(brands).orderBy(asc(brands.displayOrder));
      const existingLengths = await db.select().from(brandLengths);
      const existingModels = await db.select().from(brandModels);
      const existingVariations = await db.select().from(brandVariations);

      if (existingBrands.length > 0) {
        await db.transaction(async (tx) => {
          for (const b of existingBrands) {
            // Level 1: Brand / Main Category
            const [brandNode] = await tx
              .insert(catalogNodes)
              .values({
                parentId: null,
                level: 1,
                name: b.name,
                description: b.category,
                displayOrder: b.displayOrder || 0,
              })
              .returning();

            const lengthsForBrand = existingLengths.filter((l) => l.brandId === b.id);
            for (const l of lengthsForBrand) {
              const rawLength = String(l.lengthInMeters || "").trim();
              const lengthLabel = rawLength.toLowerCase().includes("m") ? rawLength : `${rawLength} metres`;

              // Level 2: Length
              const [lengthNode] = await tx
                .insert(catalogNodes)
                .values({
                  parentId: brandNode.id,
                  level: 2,
                  name: lengthLabel,
                })
                .returning();

              const modelsForLength = existingModels.filter((m) => m.brandLengthId === l.id);
              for (const m of modelsForLength) {
                // Level 3: Model
                const [modelNode] = await tx
                  .insert(catalogNodes)
                  .values({
                    parentId: lengthNode.id,
                    level: 3,
                    name: m.name,
                    description: m.description,
                  })
                  .returning();

                const variationsForModel = existingVariations.filter((v) => v.modelId === m.id);
                for (const v of variationsForModel) {
                  // Level 4: Spec & Price
                  await tx.insert(catalogNodes).values({
                    parentId: modelNode.id,
                    level: 4,
                    name: v.thickness || "Standard Specification",
                    price: v.price,
                    salePrice: v.salePrice,
                    colors: v.colors || "[]",
                    stock: v.stock || 100,
                  });
                }
              }
            }
          }
        });

        // Re-fetch after seeding
        allNodes = await db
          .select()
          .from(catalogNodes)
          .orderBy(asc(catalogNodes.displayOrder), asc(catalogNodes.id));
      }
    }

    return NextResponse.json({
      success: true,
      nodes: allNodes,
    });
  } catch (error: any) {
    console.error("Error fetching catalog tree:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch catalog tree" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parentId, name, description, price, salePrice, colors, stock, level } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    let calculatedLevel = level;
    if (!calculatedLevel) {
      if (parentId) {
        const parent = await db
          .select({ level: catalogNodes.level })
          .from(catalogNodes)
          .where(eq(catalogNodes.id, Number(parentId)))
          .limit(1);
        calculatedLevel = parent.length > 0 ? parent[0].level + 1 : 2;
      } else {
        calculatedLevel = 1;
      }
    }

    const [inserted] = await db
      .insert(catalogNodes)
      .values({
        parentId: parentId ? Number(parentId) : null,
        level: Number(calculatedLevel) || 1,
        name: name.trim(),
        description: description ? description.trim() : null,
        price: price !== undefined && price !== "" && !isNaN(Number(price)) ? Number(price) : null,
        salePrice: salePrice !== undefined && salePrice !== "" && !isNaN(Number(salePrice)) ? Number(salePrice) : null,
        colors: Array.isArray(colors) ? JSON.stringify(colors) : colors ? String(colors) : "[]",
        stock: stock !== undefined && !isNaN(Number(stock)) ? Number(stock) : 100,
      })
      .returning();

    return NextResponse.json({ success: true, node: inserted });
  } catch (error: any) {
    console.error("Error creating catalog node:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create catalog node" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, price, salePrice, colors, stock } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Node ID is required" }, { status: 400 });
    }

    const numId = Number(id);
    const updateValues: any = {};

    if (name !== undefined) updateValues.name = name.trim();
    if (description !== undefined) updateValues.description = description ? description.trim() : null;
    if (price !== undefined) updateValues.price = price !== "" && !isNaN(Number(price)) ? Number(price) : null;
    if (salePrice !== undefined) updateValues.salePrice = salePrice !== "" && !isNaN(Number(salePrice)) ? Number(salePrice) : null;
    if (colors !== undefined) updateValues.colors = Array.isArray(colors) ? JSON.stringify(colors) : String(colors);
    if (stock !== undefined) updateValues.stock = !isNaN(Number(stock)) ? Number(stock) : 100;

    const [updated] = await db
      .update(catalogNodes)
      .set(updateValues)
      .where(eq(catalogNodes.id, numId))
      .returning();

    return NextResponse.json({ success: true, node: updated });
  } catch (error: any) {
    console.error("Error updating catalog node:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update catalog node" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Node ID is required" }, { status: 400 });
    }

    const numId = Number(id);
    const idsToDelete = await getAllDescendantIds(numId);

    if (idsToDelete.length > 0) {
      await db.delete(catalogNodes).where(inArray(catalogNodes.id, idsToDelete));
    }

    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      deletedIds: idsToDelete,
    });
  } catch (error: any) {
    console.error("Error deleting catalog node:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete catalog node" },
      { status: 500 }
    );
  }
}
