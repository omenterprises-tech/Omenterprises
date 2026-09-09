import { db } from "../src/db";
import { homeCategoryBanners } from "../src/db/schema";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

async function main() {
  const items = await db.select().from(homeCategoryBanners);
  console.log("BANNERS IN DB:", JSON.stringify(items, null, 2));
}

main();
