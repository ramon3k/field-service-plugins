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

async function cleanDatabase(dbName, removeOnly = false) {
  console.log(`\n🧹 Cleaning ${dbName}...`);
  
  const dbConfig = { ...config, database: dbName };
  const pool = await sql.connect(dbConfig);
  
  try {
    // Tables in dependency order (reverse for deletion)
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
    
    let totalDeleted = 0;
    
    for (const table of tables) {
      try {
        let result;
        if (removeOnly) {
          // Only remove WHERE CompanyCode='DEMO' (for production DB)
          result = await pool.request().query(`DELETE FROM ${table} WHERE CompanyCode = 'DEMO'`);
        } else {
          // Delete everything (for demo DB)
          result = await pool.request().query(`DELETE FROM ${table}`);
        }
        
        if (result.rowsAffected[0] > 0) {
          console.log(`  ✓ ${table}: deleted ${result.rowsAffected[0]} rows`);
          totalDeleted += result.rowsAffected[0];
        }
      } catch (err) {
        // Table might not exist or CompanyCode column might not exist
        console.log(`  ⚠ ${table}: ${err.message}`);
      }
    }
    
    console.log(`\n✅ ${dbName}: Removed ${totalDeleted} total rows`);
    
  } finally {
    await pool.close();
  }
}

async function main() {
  console.log('🚨 CLEANING ALL DEMO DATA FROM BOTH DATABASES');
  console.log('================================================\n');
  
  // Step 1: Remove DEMO data from production database
  console.log('Step 1: Removing demo data (CompanyCode=DEMO) from production database...');
  await cleanDatabase('FieldServiceDB', true);
  
  // Step 2: Clear everything from demo database
  console.log('\nStep 2: Clearing all data from demo database...');
  await cleanDatabase('FieldServiceDB-DEMO', false);
  
  console.log('\n✅ CLEANUP COMPLETE');
  console.log('====================');
  console.log('Production DB: Should only have DCPSP data');
  console.log('Demo DB: Should be completely empty');
  console.log('\nYou can now manually create demo data with proper naming.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
