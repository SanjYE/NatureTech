const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createSensorsTable = async () => {
  const client = await pool.connect();
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS sensors (
        sensor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID REFERENCES organisations(organisation_id),
        site_id UUID REFERENCES sites(site_id),
        sensor_type VARCHAR(50) NOT NULL,
        manufacturer VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        installed_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await client.query(query);
    console.log("Sensors table created successfully.");
  } catch (err) {
    console.error("Error creating sensors table:", err);
  } finally {
    client.release();
    pool.end();
  }
};

createSensorsTable();
