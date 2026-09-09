import { db } from "../src/db";
import { brands } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Updating brand categories in remote database...");
  const result = await db
    .update(brands)
    .set({ category: "General Items" })
    .where(eq(brands.category, "General"))
    .returning();
  console.log("Updated Brands:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
