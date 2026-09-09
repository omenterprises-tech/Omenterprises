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
  console.log("Migrating CRM tables...");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS crm_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      is_onboarding_completed INTEGER DEFAULT 0,
      created_at TEXT,
      last_login_at TEXT
    );
  `);
  console.log("✓ crm_users table ensured.");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS crm_businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES crm_users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      email TEXT NOT NULL,
      address_line_1 TEXT,
      address_line_2 TEXT,
      logo_url TEXT,
      signature_url TEXT,
      signature_type TEXT,
      date_format TEXT DEFAULT 'dd/MM/yyyy',
      currency_code TEXT DEFAULT 'INR',
      currency_country TEXT DEFAULT 'India',
      currency_price_formatted TEXT DEFAULT '₹999,999.12',
      created_at TEXT,
      updated_at TEXT
    );
  `);
  console.log("✓ crm_businesses table ensured.");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
