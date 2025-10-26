// Load Demo Data to Azure SQL using Node.js
// Uses the same connection as the API server

// Load environment from server directory
require('dotenv').config({ path: './server/.env' });
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  server: process.env.DB_SERVER,
  database: 'FieldServiceDB-DEMO', // Separate demo database
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

async function executeSqlFile(pool, filepath) {
  const sqlContent = fs.readFileSync(filepath, 'utf8');
  
  // Split by GO statements
  const batches = sqlContent
    .split(/^\s*GO\s*$/gim)
    .map(batch => batch.trim())
    .filter(batch => batch.length > 0);
  
  console.log(`📄 Found ${batches.length} SQL batches in ${path.basename(filepath)}`);
  
  for (let i = 0; i < batches.length; i++) {
    try {
      console.log(`   Executing batch ${i + 1}/${batches.length}...`);
      await pool.request().query(batches[i]);
    } catch (err) {
      console.error(`   ❌ Error in batch ${i + 1}:`, err.message);
      throw err;
    }
  }
  
  console.log(`   ✅ All batches completed successfully`);
}

async function loadDemoData() {
  console.log('\n================================================================');
  console.log('  📊 Loading Comprehensive Demo Data to Azure SQL');
  console.log('================================================================\n');
  
  console.log('Configuration:');
  console.log(`   Server: ${dbConfig.server}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log('');
  
  let pool;
  
  try {
    console.log('🔌 Connecting to Azure SQL...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected successfully\n');
    
    // Load demo data (users, customers, sites, licenses)
    console.log('📥 Loading demo data with CompanyCode=DEMO...');
    const dataFile = path.join(__dirname, 'database', 'load-demo-data-final.sql');
    await executeSqlFile(pool, dataFile);
    console.log('✅ Demo data loaded\n');
    
    console.log('================================================================');
    console.log('  ✅ Demo Data Loaded Successfully!');
    console.log('================================================================\n');
    
    console.log('📊 What was created:');
    console.log('   • 14 Demo Users (technicians in CA, TX, NY, FL, IL, WA, CO, GA)');
    console.log('   • 18 Demo Customers (nationwide coverage)');
    console.log('   • 27 Demo Sites (with real geocoordinates)');
    console.log('   • 22 Demo Licenses (security systems)');
    console.log('   • 35 Demo Tickets (various statuses and priorities)');
    console.log('   • Activity logs for in-progress tickets');
    console.log('   • Notes with customer context');
    console.log('');
    console.log('🎯 Ready to test!');
    console.log('');
    console.log('To access demo data:');
    console.log('   • Login with: demo-admin / demo123');
    console.log('   • Or any demo-tech-XX user / demo123');
    console.log('   • Company Code: DEMO or KIT');
    console.log('');
    console.log('All demo data is prefixed with DEMO- for easy identification.');
    console.log('');
    
  } catch (err) {
    console.error('\n❌ Error loading demo data:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run the loader
loadDemoData();
