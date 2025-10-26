const sql = require('mssql');

const config = {
  server: 'customer-portal-sql-server.database.windows.net',
  authentication: {
    type: 'default',
    options: {
      userName: 'sqladmin',
      password: 'CustomerPortal2025!'
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function checkDatabase(dbName) {
  console.log(`\n📊 Checking ${dbName}...`);
  console.log('='.repeat(60));
  
  const dbConfig = { ...config, database: dbName };
  const pool = await sql.connect(dbConfig);
  
  try {
    // Count by company code
    const tables = ['Users', 'Customers', 'Sites', 'Tickets', 'Licenses', 'ActivityLog'];
    
    for (const table of tables) {
      try {
        // Try to get count by CompanyCode
        const result = await pool.request().query(`
          SELECT 
            CompanyCode,
            COUNT(*) as Count
          FROM ${table}
          GROUP BY CompanyCode
          ORDER BY CompanyCode
        `);
        
        if (result.recordset.length === 0) {
          console.log(`  ${table}: Empty`);
        } else {
          console.log(`  ${table}:`);
          result.recordset.forEach(row => {
            console.log(`    - CompanyCode='${row.CompanyCode}': ${row.Count} rows`);
          });
        }
      } catch (err) {
        // Table might not have CompanyCode column or might not exist
        try {
          const countResult = await pool.request().query(`SELECT COUNT(*) as Total FROM ${table}`);
          console.log(`  ${table}: ${countResult.recordset[0].Total} rows (no CompanyCode column)`);
        } catch (err2) {
          console.log(`  ${table}: Table not found or error`);
        }
      }
    }
    
  } finally {
    await pool.close();
  }
}

async function main() {
  console.log('🔍 DATABASE VERIFICATION REPORT');
  console.log('='.repeat(60));
  console.log('Checking both databases for proper isolation...\n');
  
  try {
    // Check production database
    await checkDatabase('FieldServiceDB');
    
    // Check demo database
    await checkDatabase('FieldServiceDB-DEMO');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\nExpected results:');
    console.log('  FieldServiceDB: Should only have CompanyCode=DCPSP data');
    console.log('  FieldServiceDB-DEMO: Should be empty (or only DEMO/KIT data)');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
