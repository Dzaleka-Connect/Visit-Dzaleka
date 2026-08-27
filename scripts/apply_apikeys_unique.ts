import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected to database.");

  console.log("Dropping non-unique prefix index...");
  await client.query('DROP INDEX IF EXISTS "IDX_apikeys_prefix";');

  console.log("Adding unique constraint on key_prefix...");
  // First, check if there are duplicate prefixes
  const dupes = await client.query(`
    SELECT key_prefix, COUNT(*) 
    FROM api_keys 
    GROUP BY key_prefix 
    HAVING COUNT(*) > 1;
  `);
  if (dupes.rows.length > 0) {
    console.error("Warning: Found duplicate key prefixes in database! Cannot add unique constraint.", dupes.rows);
    process.exit(1);
  }

  // Check if unique constraint already exists to prevent error on re-run
  const existingConstraint = await client.query(`
    SELECT conname 
    FROM pg_constraint 
    WHERE conname = 'api_keys_key_prefix_unique';
  `);

  if (existingConstraint.rows.length === 0) {
    await client.query(`
      ALTER TABLE api_keys 
      ADD CONSTRAINT api_keys_key_prefix_unique UNIQUE (key_prefix);
    `);
    console.log("Unique constraint added successfully!");
  } else {
    console.log("Unique constraint already exists.");
  }

  console.log("Migration complete!");
  await client.end();
}

main().catch(console.error);
