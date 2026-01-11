const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function listUsers() {
  try {
    await client.connect();
    
    // Join profiles and memberships to see roles
    const query = `
      SELECT p.email, p.full_name, om.role
      FROM profiles p
      JOIN organisation_memberships om ON p.user_id = om.user_id
    `;
    
    const res = await client.query(query);
    console.log("--- Demo Users ---");
    console.table(res.rows);
    
  } catch (err) {
    console.error('Error', err);
  } finally {
    await client.end();
  }
}

listUsers();
