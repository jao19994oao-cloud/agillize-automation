const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

// Carrega .env que está na pasta backend
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.error('.env not found at', envPath);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
});

async function inspect() {
  try {
    await pool.connect();

    const tablesRes = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema NOT IN ('pg_catalog','information_schema')
      ORDER BY table_schema, table_name
    `);

    const fkRes = await pool.query(`
      SELECT
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_schema, tc.table_name
    `);

    console.log('Tables:');
    tablesRes.rows.forEach(r => console.log(`${r.table_schema}.${r.table_name}`));

    console.log('\nForeign keys:');
    fkRes.rows.forEach(r => {
      console.log(`${r.table_schema}.${r.table_name}.${r.column_name} -> ${r.foreign_table_schema}.${r.foreign_table_name}.${r.foreign_column_name} (${r.constraint_name})`);
    });

  } catch (err) {
    console.error('Error inspecting database:', err.message || err);
  } finally {
    await pool.end();
  }
}

inspect();
