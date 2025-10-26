const sql = require('mssql');

// Azure SQL Database Configuration
const config = {
  server: 'customer-portal-sql-server.database.windows.net',
  database: 'FieldServiceDB-DEMO',
  authentication: {
    type: 'azure-active-directory-default'
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

async function checkUsers() {
  let pool;
  
  try {
    console.log('🔌 Connecting to FieldServiceDB-DEMO...');
    pool = await sql.connect(config);
    console.log('✅ Connected\n');

    // Check table structure
    console.log('📋 Checking Users table structure...');
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nUsers table columns:');
    columns.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });

    // Check all users
    console.log('\n\n👥 Checking all users (no IsActive filter)...');
    const allUsers = await pool.request().query('SELECT * FROM Users');
    
    if (allUsers.recordset.length === 0) {
      console.log('❌ No users found in table!');
    } else {
      console.log(`\n✅ Found ${allUsers.recordset.length} user(s):\n`);
      allUsers.recordset.forEach(user => {
        console.log(`User: ${user.Username}`);
        console.log(`  - ID: ${user.ID}`);
        console.log(`  - FullName: ${user.FullName}`);
        console.log(`  - Role: ${user.Role}`);
        console.log(`  - CompanyCode: ${user.CompanyCode}`);
        console.log(`  - IsActive: ${user.IsActive}`);
        console.log(`  - PasswordHash: ${user.PasswordHash ? user.PasswordHash.substring(0, 20) + '...' : 'NULL'}`);
        console.log(`  - Password (column exists): ${user.Password ? 'YES' : 'NO'}`);
        console.log('');
      });
    }

    // Try the login query
    console.log('🔐 Testing login query with IsActive = 1...');
    const loginTest = await pool.request()
      .input('username', sql.NVarChar, 'demo-admin')
      .query('SELECT * FROM Users WHERE Username = @username AND IsActive = 1');
    
    console.log(`Result: Found ${loginTest.recordset.length} user(s)`);

    // Try without IsActive filter
    console.log('\n🔐 Testing login query WITHOUT IsActive filter...');
    const loginTest2 = await pool.request()
      .input('username', sql.NVarChar, 'demo-admin')
      .query('SELECT * FROM Users WHERE Username = @username');
    
    console.log(`Result: Found ${loginTest2.recordset.length} user(s)`);
    if (loginTest2.recordset.length > 0) {
      const user = loginTest2.recordset[0];
      console.log(`  - IsActive value: ${user.IsActive} (type: ${typeof user.IsActive})`);
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Connection closed');
    }
  }
}

checkUsers().catch(console.error);
