const sql = require('mssql');

const config = {
  server: 'customer-portal-sql-server.database.windows.net',
  database: 'FieldServiceDB',
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

async function main() {
  console.log('🧹 Cleaning remaining demo data from production database...\n');
  
  const pool = await sql.connect(config);
  
  try {
    // Delete ActivityLog entries for demo users first
    console.log('Deleting ActivityLog entries for demo users...');
    const activityResult = await pool.request().query(`
      DELETE FROM ActivityLog 
      WHERE CompanyCode = 'DEMO' OR UserID IN (
        SELECT ID FROM Users WHERE CompanyCode = 'DEMO'
      )
    `);
    console.log(`  ✓ Deleted ${activityResult.rowsAffected[0]} ActivityLog rows`);
    
    // Now delete demo users
    console.log('Deleting demo users...');
    const userResult = await pool.request().query(`
      DELETE FROM Users WHERE CompanyCode = 'DEMO'
    `);
    console.log(`  ✓ Deleted ${userResult.rowsAffected[0]} User rows`);
    
    console.log('\n✅ Production database cleaned completely!');
    
  } finally {
    await pool.close();
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
