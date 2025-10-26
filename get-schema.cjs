// Query Azure database to get actual table schemas
require('dotenv').config({ path: './server/.env' });
const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER,
  database: 'FieldServiceDB-DEMO',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

async function getSchema() {
  console.log('🔍 Connecting to FieldServiceDB-DEMO to get schema...\n');
  
  const pool = await sql.connect(dbConfig);
  
  // Get all tables
  const tables = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `);
  
  console.log('📊 Tables found:');
  console.log(tables.recordset.map(t => `  - ${t.TABLE_NAME}`).join('\n'));
  console.log('\n');
  
  // Get columns for each important table
  const importantTables = ['Users', 'Customers', 'Sites', 'Tickets', 'AuditTrail', 'CoordinatorNotes', 'ActivityLog'];
  
  for (const tableName of importantTables) {
    console.log(`\n📋 ${tableName} columns:`);
    const columns = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION
    `);
    
    if (columns.recordset.length > 0) {
      columns.recordset.forEach(col => {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${col.COLUMN_NAME.padEnd(25)} ${col.DATA_TYPE}${length.padEnd(10)} ${nullable}`);
      });
    } else {
      console.log('  (Table not found)');
    }
  }
  
  await pool.close();
}

getSchema().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
