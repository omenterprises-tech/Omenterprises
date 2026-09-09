import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import * as path from "path";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

dotenv.config({ path: path.join(__dirname, "../.env") });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || "file:./sqlite.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Altering table home_category_banners...");
  try {
    await client.execute("ALTER TABLE home_category_banners ADD COLUMN mobile_image_url TEXT;");
    console.log("Column mobile_image_url added successfully!");
  } catch (err: any) {
    console.error("Migration failed (might already exist):", err.message);
  }
}

main();
