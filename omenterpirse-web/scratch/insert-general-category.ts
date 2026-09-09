import { db } from "../src/db";
import { categories } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Inserting new 'General' category...");
  try {
    // Check if category already exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, "general"))
      .limit(1);

    if (existing.length > 0) {
      console.log("Category 'General' already exists, updating it...");
      const updated = await db
        .update(categories)
        .set({
          name: "General",
          imageUrl: "/images/general_category.jpg",
          displayOrder: 3,
          isActive: true,
          tagline: "Electrical tape, spring wires, flexible pipes & other essentials",
        })
        .where(eq(categories.id, existing[0].id))
        .returning();
      console.log("[✓] Category updated:", JSON.stringify(updated, null, 2));
    } else {
      const inserted = await db
        .insert(categories)
        .values({
          name: "General",
          slug: "general",
          imageUrl: "/images/general_category.jpg",
          displayOrder: 3,
          isActive: true,
          tagline: "Electrical tape, spring wires, flexible pipes & other essentials",
        })
        .returning();
      console.log("[✓] Category inserted:", JSON.stringify(inserted, null, 2));
    }
  } catch (err) {
    console.error("Error inserting category:", err);
  }
}

main().catch(console.error);
