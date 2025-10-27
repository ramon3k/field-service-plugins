const sql = require('mssql');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
require('dotenv').config();

// Database configuration via environment variables (do NOT hardcode secrets)
const DB_SERVER = process.env.DEMO_DB_SERVER || process.env.DB_SERVER;
const DB_NAME = process.env.DEMO_DB_NAME || process.env.DB_NAME || 'FieldServiceDB-DEMO';
const DB_USER = process.env.DEMO_DB_USER || process.env.DB_USER;
const DB_PASSWORD = process.env.DEMO_DB_PASSWORD || process.env.DB_PASSWORD;

if (!DB_SERVER || !DB_USER || !DB_PASSWORD) {
  console.error('❌ Missing database configuration. Please set DEMO_DB_SERVER, DEMO_DB_NAME, DEMO_DB_USER, DEMO_DB_PASSWORD in a local .env file (not committed).');
  process.exit(1);
}

const config = {
  server: DB_SERVER,
  database: DB_NAME,
  authentication: {
    type: 'default',
    options: {
      userName: DB_USER,
      password: DB_PASSWORD
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function loadUsers() {
  console.log('👥 Creating 3 demo users...\n');
  const plainPassword = process.env.DEMO_PASSWORD || crypto.randomBytes(10).toString('base64');
  const passwordBase64 = Buffer.from(plainPassword).toString('base64');
  
  const pool = await sql.connect(config);
  
  try {
    const users = [
      { id: uuidv4(), username: 'demo-admin', password: passwordBase64, fullName: 'Demo Administrator', email: 'admin@democorp.com', role: 'Admin', vendor: null },
      { id: uuidv4(), username: 'demo-coordinator', password: passwordBase64, fullName: 'Sarah Johnson', email: 'sarah@democorp.com', role: 'Coordinator', vendor: null },
      { id: uuidv4(), username: 'demo-tech', password: passwordBase64, fullName: 'Mike Chen', email: 'mike@democorp.com', role: 'Technician', vendor: 'Coast Guard Security' }
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
  console.log(`  - demo-admin / ${plainPassword} (Administrator)`);
  console.log(`  - demo-coordinator / ${plainPassword} (Coordinator)`);
  console.log(`  - demo-tech / ${plainPassword} (Technician)`);
  console.log('\nCompany Code: DEMO');
    
  } finally {
    await pool.close();
  }
}

loadUsers().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
