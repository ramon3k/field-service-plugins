require('dotenv').config({ path: './server/.env' });
const sql = require('mssql');

async function clearDemoDatabase() {
  console.log('🗑️  Clearing FieldServiceDB-DEMO...\n');
  
  const pool = await sql.connect({
    server: process.env.DB_SERVER,
    database: 'FieldServiceDB-DEMO',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: { encrypt: true, trustServerCertificate: false }
  });
  
  // Delete in proper order (respecting foreign keys)
  const tables = [
    'ActivityLog',
    'CoordinatorNotes',
    'AuditTrail',
    'Attachments',
    'Tickets',
    'Licenses',
    'Assets',
    'Sites',
    'Customers',
    'ServiceRequests',
    'Vendors',
    'Users'
  ];
  
  for (const table of tables) {
    try {
      await pool.request().query(`DELETE FROM ${table}`);
      console.log(`✅ Cleared ${table}`);
    } catch (err) {
      console.log(`⚠️  ${table}: ${err.message}`);
    }
  }
  
  console.log('\n✅ FieldServiceDB-DEMO cleared!');
  await pool.close();
}

clearDemoDatabase().catch(console.error);
