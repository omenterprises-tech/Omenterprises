import { client } from "./index";

async function runMigration() {
  console.log("Running migration for phone_numbers and header_phone_numbers...");

  try {
    await client.execute("ALTER TABLE crm_businesses ADD COLUMN phone_numbers text");
    console.log("✓ Added 'phone_numbers' to crm_businesses");
  } catch (e: any) {
    console.log("• Column 'phone_numbers' already exists or skipped:", e.message);
  }

  try {
    await client.execute("ALTER TABLE crm_quotations ADD COLUMN header_phone_numbers text");
    console.log("✓ Added 'header_phone_numbers' to crm_quotations");
  } catch (e: any) {
    console.log("• Column 'header_phone_numbers' already exists or skipped:", e.message);
  }

  // Backfill existing businesses that have mobile_number but null phone_numbers
  try {
    const businesses = await client.execute("SELECT id, mobile_number, phone_numbers FROM crm_businesses");
    for (const row of businesses.rows) {
      if (!row.phone_numbers && row.mobile_number) {
        const initialNumbers = JSON.stringify([String(row.mobile_number).trim()]);
        await client.execute({
          sql: "UPDATE crm_businesses SET phone_numbers = ? WHERE id = ?",
          args: [initialNumbers, row.id],
        });
        console.log(`✓ Backfilled business id ${row.id} with phone_numbers: ${initialNumbers}`);
      }
    }
  } catch (e: any) {
    console.log("• Backfill check skipped:", e.message);
  }

  console.log("Migration complete!");
}

runMigration().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
