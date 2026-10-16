import { client } from "./index";

async function runMigration() {
  console.log("Running migration for UPI ID, UPI QR Code, and Payment Display Option...");

  try {
    await client.execute("ALTER TABLE crm_businesses ADD COLUMN upi_id text");
    console.log("✓ Added 'upi_id' to crm_businesses");
  } catch (e: any) {
    console.log("• Column 'upi_id' already exists or skipped:", e.message);
  }

  try {
    await client.execute("ALTER TABLE crm_businesses ADD COLUMN upi_qr_code_url text");
    console.log("✓ Added 'upi_qr_code_url' to crm_businesses");
  } catch (e: any) {
    console.log("• Column 'upi_qr_code_url' already exists or skipped:", e.message);
  }

  try {
    await client.execute("ALTER TABLE crm_quotations ADD COLUMN payment_display_option text DEFAULT 'both'");
    console.log("✓ Added 'payment_display_option' to crm_quotations");
  } catch (e: any) {
    console.log("• Column 'payment_display_option' already exists or skipped:", e.message);
  }

  console.log("Migration complete!");
}

runMigration().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
