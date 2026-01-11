const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  const client = await pool.connect();
  try {
    console.log('Creating alerts and recommendations tables...');

    await client.query('BEGIN');

    // Create Alerts Table
    // We are simplifying slightly to match current available tables (sites, observations)
    // We omit FKs to non-existent tables (plants, crop_cycles, indicators) for now
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID REFERENCES sites(site_id),
        observation_id UUID REFERENCES observations(observation_id),
        alert_type TEXT,
        severity TEXT,
        message TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        acknowledged_at TIMESTAMPTZ,
        acknowledged_by UUID
      );
    `);

    // Create Recommendations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID REFERENCES sites(site_id),
        alert_id UUID REFERENCES alerts(alert_id),
        title TEXT,
        body TEXT,
        priority TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        due_by TIMESTAMPTZ
      );
    `);

    await client.query('COMMIT');
    console.log('Tables created successfully.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
  } finally {
    client.release();
    pool.end();
  }
}

createTables();
