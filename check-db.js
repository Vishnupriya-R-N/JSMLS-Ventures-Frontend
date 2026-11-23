const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const db = await client.query('SELECT current_database(), current_user');
  console.log('Connected to database:', db.rows[0]);

  const seq = await client.query(`
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_name = 'vc_user_id_seq'
  `);
  console.log('Sequence exists?', seq.rows.length > 0);

  console.log('Creating sequence...');
  await client.query('CREATE SEQUENCE IF NOT EXISTS vc_user_id_seq START 100001');
  console.log('Sequence created (or already existed).');

  const seq2 = await client.query(`
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_name = 'vc_user_id_seq'
  `);
  console.log('Sequence exists now?', seq2.rows.length > 0);

  await client.end();
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});