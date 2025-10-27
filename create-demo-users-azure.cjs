const sql = require('mssql');
const crypto = require('crypto');
require('dotenv').config();

// Azure SQL Database Configuration (via environment variables)
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
  user: DB_USER,
  password: DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function createDemoUsers() {
  let pool;
  
  try {
    console.log('🔌 Connecting to Azure SQL Database: FieldServiceDB-DEMO...');
    pool = await sql.connect(config);
    console.log('✅ Connected to FieldServiceDB-DEMO\n');

    // Demo users to create
    const plainPassword = process.env.DEMO_PASSWORD || crypto.randomBytes(10).toString('base64');
    const encodedPassword = Buffer.from(plainPassword).toString('base64');
    const users = [
      {
        id: 'demo-admin',
        username: 'demo-admin',
        password: encodedPassword, // Base64 encoded
        fullName: 'Demo Administrator',
        email: 'demo-admin@demo.com',
        role: 'Admin',
        companyCode: 'DEMO'
      },
      {
        id: 'demo-coordinator',
        username: 'demo-coordinator',
        password: encodedPassword,
        fullName: 'Demo Coordinator',
        email: 'demo-coordinator@demo.com',
        role: 'Coordinator',
        companyCode: 'DEMO'
      },
      {
        id: 'demo-tech',
        username: 'demo-tech',
        password: encodedPassword,
        fullName: 'Demo Technician',
        email: 'demo-tech@demo.com',
        role: 'Technician',
        companyCode: 'DEMO'
      }
    ];

    console.log('👥 Creating demo users...\n');

    for (const user of users) {
      try {
        // Check if user already exists
        const checkResult = await pool.request()
          .input('username', sql.NVarChar, user.username)
          .query('SELECT ID FROM Users WHERE Username = @username');

        if (checkResult.recordset.length > 0) {
          console.log(`⚠️  User ${user.username} already exists - skipping`);
          continue;
        }

        // Insert new user
        await pool.request()
          .input('id', sql.NVarChar, user.id)
          .input('username', sql.NVarChar, user.username)
          .input('password', sql.NVarChar, user.password)
          .input('fullName', sql.NVarChar, user.fullName)
          .input('email', sql.NVarChar, user.email)
          .input('role', sql.NVarChar, user.role)
          .input('companyCode', sql.NVarChar, user.companyCode)
          .query(`
            INSERT INTO Users (ID, Username, Password, FullName, Email, Role, CompanyCode)
            VALUES (@id, @username, @password, @fullName, @email, @role, @companyCode)
          `);

        console.log(`✅ Created user: ${user.username} (${user.role})`);
        console.log(`   - Full Name: ${user.fullName}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Password: ${plainPassword}`);
        console.log(`   - Company Code: ${user.companyCode}\n`);
      } catch (err) {
        console.error(`❌ Error creating user ${user.username}:`, err.message);
      }
    }

    // Verify users were created
    console.log('\n📋 Verifying users in database...');
    const allUsers = await pool.request()
      .query('SELECT ID, Username, FullName, Role, CompanyCode FROM Users');

    console.log(`\n✅ Total users in FieldServiceDB-DEMO: ${allUsers.recordset.length}`);
    allUsers.recordset.forEach(user => {
      console.log(`   - ${user.Username} (${user.Role}) - Company: ${user.CompanyCode || 'N/A'}`);
    });

    console.log('\n🎉 Demo users created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Company Code: DEMO');
    console.log('   Username: demo-admin, demo-coordinator, or demo-tech');
  console.log(`   Password: ${plainPassword}`);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
createDemoUsers().catch(console.error);
