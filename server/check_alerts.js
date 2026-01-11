const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkAlerts() {
  try {
    await client.connect();
    
    const res = await client.query(`
      SELECT alert_id, alert_type, status, created_at 
      FROM alerts 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    console.log("--- Recent Alerts ---");
    console.table(res.rows);
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkAlerts();
