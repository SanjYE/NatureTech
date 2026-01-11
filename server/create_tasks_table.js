const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTasksTable() {
  const client = await pool.connect();
  try {
    console.log('Creating tasks table...');

    await client.query('BEGIN');

    // Create Tasks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID REFERENCES organisations(organisation_id),
        created_by UUID REFERENCES profiles(user_id),
        assigned_to UUID REFERENCES profiles(user_id),
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
        due_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );
    `);

    await client.query('COMMIT');
    console.log('Tasks table created successfully.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tasks table:', error);
  } finally {
    client.release();
    pool.end();
  }
}

createTasksTable();
