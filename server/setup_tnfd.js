const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupTNFD() {
  const client = await pool.connect();
  try {
    console.log('Setting up TNFD Metrics table...');

    await client.query('BEGIN');

    // Create Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tnfd_metrics (
        metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID REFERENCES sites(site_id),
        metric_name TEXT NOT NULL,
        value NUMERIC,
        unit TEXT,
        method TEXT,
        uncertainty TEXT,
        qa_status TEXT CHECK (qa_status IN ('pass', 'review', 'fail')),
        provenance TEXT,
        reported_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Check if we have any sites to link to
    const siteRes = await client.query('SELECT site_id FROM sites LIMIT 1');
    let siteId = null;
    if (siteRes.rows.length > 0) {
        siteId = siteRes.rows[0].site_id;
    }

    // Insert Sample Data (only if empty)
    const check = await client.query('SELECT COUNT(*) FROM tnfd_metrics');
    if (parseInt(check.rows[0].count) === 0) {
        console.log('Inserting sample TNFD data...');
        
        const samples = [
            { name: 'Soil Organic Carbon (SOC)', val: 34.5, unit: 'tC/ha', method: 'Non-destructive v1.0', unc: '±1.2', qa: 'pass', prov: 'Lab #4532' },
            { name: 'Water Withdrawal', val: 1250, unit: 'm³', method: 'Meter Reading', unc: '±5%', qa: 'review', prov: 'Sensor 11A' },
            { name: 'Restoration Area', val: 12.8, unit: 'ha', method: 'Satellite Imagery', unc: '±0.3', qa: 'pass', prov: 'GIS-2024-Q4' },
            { name: 'Pesticide Intensity', val: 2.3, unit: 'kg/ha', method: 'Purchase Records', unc: '±0.1', qa: 'pass', prov: 'Inventory #892' }
        ];

        for (const s of samples) {
            await client.query(`
                INSERT INTO tnfd_metrics (site_id, metric_name, value, unit, method, uncertainty, qa_status, provenance)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [siteId, s.name, s.val, s.unit, s.method, s.unc, s.qa, s.prov]);
        }
    }

    await client.query('COMMIT');
    console.log('TNFD setup complete.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up TNFD:', error);
  } finally {
    client.release();
    pool.end();
  }
}

setupTNFD();
