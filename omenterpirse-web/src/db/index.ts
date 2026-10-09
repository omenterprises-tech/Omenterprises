import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import dns from "node:dns";

// Prefer IPv4 DNS resolution first to avoid 10-second connection timeouts on Windows environments
dns.setDefaultResultOrder("ipv4first");

// Prevent Windows proxy / corporate / antivirus SSL inspection from failing cloud Turso connections
if (typeof process !== "undefined" && process.env) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Load environment variables from .env file
dotenv.config();

// This client works for both local SQLite files and Turso cloud databases
export const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || "file:./sqlite.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
