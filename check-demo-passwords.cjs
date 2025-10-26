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

async function checkPasswords() {
  const pool = await sql.connect(config);
  
  try {
    const result = await pool.request().query(`
      SELECT Username, PasswordHash, FullName, Role
      FROM Users
      WHERE CompanyCode = 'DEMO'
    `);
    
    console.log('Demo Users:\n');
    
    result.recordset.forEach(user => {
      console.log(`Username: ${user.Username}`);
      console.log(`  PasswordHash: ${user.PasswordHash}`);
      console.log(`  Full Name: ${user.FullName}`);
      console.log(`  Role: ${user.Role}`);
      
      // Decode the password hash to see what it is
      const decoded = Buffer.from(user.PasswordHash, 'base64').toString('utf8');
      console.log(`  Decoded Password: ${decoded}`);
      
      // Test encoding "demo123"
      const testPassword = 'demo123';
      const encoded = Buffer.from(testPassword).toString('base64');
      console.log(`  Test encode "demo123": ${encoded}`);
      console.log(`  Match: ${user.PasswordHash === encoded ? '✅' : '❌'}`);
      console.log('');
    });
    
  } finally {
    await pool.close();
  }
}

checkPasswords().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
