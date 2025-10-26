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

async function compareUsers() {
  console.log('🔍 Comparing user structures between databases...\n');
  
  // Check DCPSP database
  console.log('📊 FieldServiceDB (DCPSP):');
  console.log('='.repeat(60));
  const dcpspPool = await sql.connect({ ...config, database: 'FieldServiceDB' });
  
  try {
    const dcpspResult = await dcpspPool.request().query(`
      SELECT TOP 1 Username, PasswordHash, FullName, Role, IsActive, CompanyCode, 
             LEN(PasswordHash) as PasswordHashLength,
             LEN(Username) as UsernameLength
      FROM Users
      WHERE CompanyCode = 'DEFAULT'
      ORDER BY Username
    `);
    
    if (dcpspResult.recordset.length > 0) {
      const user = dcpspResult.recordset[0];
      console.log(`Username: "${user.Username}" (length: ${user.UsernameLength})`);
      console.log(`PasswordHash: "${user.PasswordHash}" (length: ${user.PasswordHashLength})`);
      console.log(`FullName: "${user.FullName}"`);
      console.log(`Role: "${user.Role}"`);
      console.log(`IsActive: ${user.IsActive}`);
      console.log(`CompanyCode: "${user.CompanyCode}"`);
      
      // Decode password
      const decoded = Buffer.from(user.PasswordHash, 'base64').toString('utf8');
      console.log(`Decoded Password: "${decoded}"`);
    }
  } finally {
    await dcpspPool.close();
  }
  
  console.log('\n📊 FieldServiceDB-DEMO (DEMO):');
  console.log('='.repeat(60));
  const demoPool = await sql.connect({ ...config, database: 'FieldServiceDB-DEMO' });
  
  try {
    const demoResult = await demoPool.request().query(`
      SELECT TOP 1 Username, PasswordHash, FullName, Role, IsActive, CompanyCode,
             LEN(PasswordHash) as PasswordHashLength,
             LEN(Username) as UsernameLength
      FROM Users
      WHERE CompanyCode = 'DEMO'
      ORDER BY Username
    `);
    
    if (demoResult.recordset.length > 0) {
      const user = demoResult.recordset[0];
      console.log(`Username: "${user.Username}" (length: ${user.UsernameLength})`);
      console.log(`PasswordHash: "${user.PasswordHash}" (length: ${user.PasswordHashLength})`);
      console.log(`FullName: "${user.FullName}"`);
      console.log(`Role: "${user.Role}"`);
      console.log(`IsActive: ${user.IsActive}`);
      console.log(`CompanyCode: "${user.CompanyCode}"`);
      
      // Decode password
      const decoded = Buffer.from(user.PasswordHash, 'base64').toString('utf8');
      console.log(`Decoded Password: "${decoded}"`);
    }
    
    // Check if Users table structure is the same
    console.log('\n📋 Checking Users table structure in DEMO database:');
    const structureResult = await demoPool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columns:');
    structureResult.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } finally {
    await demoPool.close();
  }
}

compareUsers().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
