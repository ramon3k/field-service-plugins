const sql = require('mssql');
const { v4: uuidv4 } = require('uuid');

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

async function loadUsers() {
  console.log('👥 Creating 3 demo users...\n');
  
  const pool = await sql.connect(config);
  
  try {
    const users = [
      { id: uuidv4(), username: 'demo-admin', password: 'ZGVtbzEyMw==', fullName: 'Demo Administrator', email: 'admin@democorp.com', role: 'Admin', vendor: null },
      { id: uuidv4(), username: 'demo-coordinator', password: 'ZGVtbzEyMw==', fullName: 'Sarah Johnson', email: 'sarah@democorp.com', role: 'Coordinator', vendor: null },
      { id: uuidv4(), username: 'demo-tech', password: 'ZGVtbzEyMw==', fullName: 'Mike Chen', email: 'mike@democorp.com', role: 'Technician', vendor: 'Coast Guard Security' }
    ];
    
    for (const user of users) {
      await pool.request()
        .input('id', sql.NVarChar, user.id)
        .input('username', sql.NVarChar, user.username)
        .input('password', sql.NVarChar, user.password)
        .input('fullName', sql.NVarChar, user.fullName)
        .input('email', sql.NVarChar, user.email)
        .input('role', sql.NVarChar, user.role)
        .input('vendor', sql.NVarChar, user.vendor)
        .query(`
          INSERT INTO Users (ID, Username, PasswordHash, FullName, Email, Role, IsActive, Vendor, CompanyCode)
          VALUES (@id, @username, @password, @fullName, @email, @role, 1, @vendor, 'DEMO')
        `);
      console.log(`  ✅ Created user: ${user.username}`);
    }
    
    console.log('\n✅ All users created!');
    console.log('\nLogin credentials:');
    console.log('  - demo-admin / demo123 (Administrator)');
    console.log('  - demo-coordinator / demo123 (Coordinator)');
    console.log('  - demo-tech / demo123 (Technician)');
    console.log('\nCompany Code: DEMO');
    
  } finally {
    await pool.close();
  }
}

loadUsers().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
