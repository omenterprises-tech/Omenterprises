import { db } from "../src/db";
import { brandModels, brandVariations } from "../src/db/schema";

async function main() {
  console.log("Checking brand_models and brand_variations data...");
  try {
    const models = await db.select().from(brandModels);
    console.log("Models:", JSON.stringify(models, null, 2));

    const variations = await db.select().from(brandVariations);
    console.log("Variations:", JSON.stringify(variations, null, 2));
  } catch (err) {
    console.error("Query Error:", err);
  }
}

main().catch(console.error);
