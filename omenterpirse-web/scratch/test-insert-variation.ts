import { db } from "../src/db";
import { brandVariations } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Testing insert variation with null thickness and null model_id...");
  try {
    const inserted = await db
      .insert(brandVariations)
      .values({
        modelId: null,
        brandId: 1, // Polycab brand
        thickness: null,
        colors: JSON.stringify(["Red", "Yellow", "Blue"]),
        price: 999,
        salePrice: 899,
        stock: 50,
      })
      .returning();

    console.log("[✓] Successfully inserted test variation:", JSON.stringify(inserted, null, 2));

    // Clean up
    if (inserted[0]?.id) {
      await db.delete(brandVariations).where(eq(brandVariations.id, inserted[0].id));
      console.log("[✓] Successfully cleaned up test variation");
    }
  } catch (err) {
    console.error("[-] Insert Test Failed:", err);
  }
}

main().catch(console.error);
