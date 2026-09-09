import { db } from "../src/db";
import { categories, brands } from "../src/db/schema";
import { asc } from "drizzle-orm";

async function main() {
  const cats = await db.select().from(categories).orderBy(asc(categories.displayOrder));
  console.log("Categories:", JSON.stringify(cats, null, 2));
  const bnds = await db.select().from(brands);
  console.log("Brands:", JSON.stringify(bnds, null, 2));
}

main().catch(console.error);
