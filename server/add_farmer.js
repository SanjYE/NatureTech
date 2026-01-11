const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    
    // 1. Get Org
    const orgRes = await client.query('SELECT organisation_id FROM organisations LIMIT 1');
    if (orgRes.rows.length === 0) { console.log("No orgs found"); return; }
    const orgId = orgRes.rows[0].organisation_id;

    // 2. Create Profile
    const userId = uuidv4();
    const email = 'farmer@demo.com';
    const password = await bcrypt.hash('password123', 10);
    
    // Check if exists
    let finalUserId;
    const existing = await client.query('SELECT user_id FROM profiles WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        finalUserId = existing.rows[0].user_id;
        console.log("User already exists, using id:", finalUserId);
    } else {
        await client.query(`
          INSERT INTO profiles (user_id, full_name, email, password, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [userId, 'Demo Farmer', email, password]);
        finalUserId = userId;
    }

    // 3. Add Membership
    // Check if membership is already there? The table might not have a clean primary key on (org, user) if I rely on implicit constraints.
    // Let's just try insert.
    const memCheck = await client.query('SELECT * FROM organisation_memberships WHERE user_id = $1 AND organisation_id = $2', [finalUserId, orgId]);
    if (memCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO organisation_memberships (organisation_id, user_id, role, is_active, created_at)
          VALUES ($1, $2, 'farmer', true, NOW())
        `, [orgId, finalUserId]);
    }

    console.log(`Created Farmer: ${email} / password123`);

  } catch (e) {
      console.error(e); 
  } finally { 
      client.end(); 
  }
}
run();
