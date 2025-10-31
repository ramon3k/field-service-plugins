// Update CompanyCode from KIT to DCPSP in all tables
const sql = require('mssql');
require('dotenv').config({ path: './server/.env.production' });

// Azure SQL configuration
const dbConfig = {
  server: 'field-service-server.database.windows.net',
  user: 'fieldserviceadmin',
  password: process.env.DB_PASSWORD || 'YourStrongPassword123!',
  database: 'FieldServiceDB',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

async function updateCompanyCodes() {
  let pool;
  
  try {
    console.log('Connecting to Azure SQL...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected successfully\n');

    const tables = [
      'Users',
      'Customers', 
      'Sites',
      'Tickets',
      'ServiceRequests',
      'ActivityLog',
      'Licenses'
    ];

    console.log('Updating CompanyCode from KIT to DCPSP...\n');

    for (const table of tables) {
      try {
        const result = await pool.request()
          .query(`UPDATE ${table} SET CompanyCode = 'DCPSP' WHERE CompanyCode = 'KIT'`);
        
        console.log(`✅ ${table}: Updated ${result.rowsAffected[0]} rows`);
      } catch (err) {
        console.log(`⚠️  ${table}: ${err.message}`);
      }
    }

    console.log('\n--- Verification ---\n');
    
    for (const table of tables) {
      try {
        const result = await pool.request()
          .query(`SELECT COUNT(*) as count FROM ${table} WHERE CompanyCode = 'DCPSP'`);
        
        console.log(`${table}: ${result.recordset[0].count} DCPSP records`);
      } catch (err) {
        console.log(`${table}: Could not verify (${err.message})`);
      }
    }

    console.log('\n✅ Company code updated successfully!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

updateCompanyCodes()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed:', err);
    process.exit(1);
  });
