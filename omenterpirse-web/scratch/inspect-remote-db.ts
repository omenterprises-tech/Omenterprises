import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Inspecting remote brand_models table structure...");
  try {
    const res = await db.run(sql`PRAGMA table_info(brand_models)`);
    console.log("brand_models table info:", JSON.stringify(res, null, 2));

    const res2 = await db.run(sql`PRAGMA table_info(brands)`);
    console.log("brands table info:", JSON.stringify(res2, null, 2));

    const res3 = await db.run(sql`PRAGMA table_info(brand_variations)`);
    console.log("brand_variations table info:", JSON.stringify(res3, null, 2));

    const res4 = await db.run(sql`PRAGMA table_info(brand_lengths)`);
    console.log("brand_lengths table info:", JSON.stringify(res4, null, 2));
  } catch (err) {
    console.error("Error inspecting database:", err);
  }
}

main().catch(console.error);
