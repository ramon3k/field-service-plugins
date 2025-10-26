const sql = require('mssql');

const config = {
  server: 'customer-portal-sql-server.database.windows.net',
  database: 'FieldServiceDB-DEMO',
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

async function testLogin() {
  console.log('🧪 Testing demo login locally...\n');
  
  const pool = await sql.connect(config);
  
  try {
    const username = 'demo-admin';
    const password = 'demo123';
    
    console.log(`Attempting login for: ${username}`);
    console.log(`Password: ${password}`);
    
    // Query user by username
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Users WHERE Username = @username AND IsActive = 1');
    
    console.log(`\nQuery result: Found ${result.recordset.length} user(s)`);
    
    if (result.recordset.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = result.recordset[0];
    console.log(`\n✅ User found:`);
    console.log(`  Username: ${user.Username}`);
    console.log(`  FullName: ${user.FullName}`);
    console.log(`  Role: ${user.Role}`);
    console.log(`  CompanyCode: ${user.CompanyCode}`);
    console.log(`  IsActive: ${user.IsActive}`);
    console.log(`  Stored PasswordHash: ${user.PasswordHash}`);
    
    // Verify password (base64 encoded in database)
    const passwordBase64 = Buffer.from(password).toString('base64');
    console.log(`  Computed PasswordHash: ${passwordBase64}`);
    console.log(`  Hashes match: ${user.PasswordHash === passwordBase64 ? '✅ YES' : '❌ NO'}`);
    
    if (user.PasswordHash === passwordBase64) {
      console.log('\n✅ Login would succeed!');
    } else {
      console.log('\n❌ Login would fail - password mismatch');
      console.log(`\nDebug:`);
      console.log(`  Stored length: ${user.PasswordHash.length}`);
      console.log(`  Computed length: ${passwordBase64.length}`);
      console.log(`  Stored bytes: ${Buffer.from(user.PasswordHash).toString('hex')}`);
      console.log(`  Computed bytes: ${Buffer.from(passwordBase64).toString('hex')}`);
    }
    
  } finally {
    await pool.close();
  }
}

testLogin().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err);
  process.exit(1);
});
