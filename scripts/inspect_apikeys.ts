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

  // Fetch all constraints on api_keys
  const constraintsRes = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint 
    WHERE conrelid = 'api_keys'::regclass;
  `);
  console.log("Found constraints:", constraintsRes.rows);

  // Fetch all indexes on api_keys
  const indexesRes = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'api_keys';
  `);
  console.log("Found indexes:", indexesRes.rows);

  await client.end();
}

main().catch(console.error);
