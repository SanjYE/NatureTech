const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    await client.connect();
    
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log("--- Postgres Tables & Columns ---");
    for (let row of res.rows) {
      const tableName = row.table_name;
      if (['geography_columns', 'geometry_columns', 'spatial_ref_sys'].includes(tableName)) continue;

      const colsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `, [tableName]);
      
      const columns = colsRes.rows.map(c => c.column_name).join(', ');
      console.log(`TABLE: ${tableName}`);
      console.log(`COLUMNS: ${columns}`);
      console.log("-----------------------");
    }
    
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

checkTables();
