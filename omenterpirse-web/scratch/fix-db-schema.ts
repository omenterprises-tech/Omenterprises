import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function main() {
  const { db } = await import("../src/db");
  const { sql } = await import("drizzle-orm");

  console.log("Creating crm_customers and crm_quotations tables...");

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS crm_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL REFERENCES crm_businesses(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      gstin TEXT,
      created_by_user_id INTEGER REFERENCES crm_users(id) ON DELETE SET NULL,
      created_at TEXT,
      updated_at TEXT
    );
  `);
  console.log("[✓] crm_customers table ensured.");

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS crm_quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL REFERENCES crm_businesses(id) ON DELETE CASCADE,
      quotation_number TEXT NOT NULL,
      quotation_date TEXT NOT NULL,
      valid_until TEXT,
      customer_id INTEGER REFERENCES crm_customers(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      customer_address TEXT,
      customer_gstin TEXT,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax_total REAL NOT NULL,
      grand_total REAL NOT NULL,
      notes TEXT,
      terms_conditions TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_by_user_id INTEGER NOT NULL REFERENCES crm_users(id) ON DELETE CASCADE,
      created_by_name TEXT NOT NULL,
      created_by_role TEXT NOT NULL DEFAULT 'Staff',
      created_at TEXT,
      updated_at TEXT
    );
  `);
  console.log("[✓] crm_quotations table ensured.");

  const res1 = await db.run(sql`PRAGMA table_info(crm_customers)`);
  console.log("crm_customers columns:", res1.rows.map((r: any) => r[1] || r.name));

  const res2 = await db.run(sql`PRAGMA table_info(crm_quotations)`);
  console.log("crm_quotations columns:", res2.rows.map((r: any) => r[1] || r.name));
}

main().catch(console.error);
