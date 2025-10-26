require('dotenv').config({ path: './server/.env' });
const sql = require('mssql');

async function checkLicenses() {
  const pool = await sql.connect({
    server: process.env.DB_SERVER,
    database: 'FieldServiceDB',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: { encrypt: true, trustServerCertificate: false }
  });
  
  const result = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Licenses'
    ORDER BY ORDINAL_POSITION
  `);
  
  console.log('Licenses table columns:');
  result.recordset.forEach(col => {
    console.log(`  ${col.COLUMN_NAME.padEnd(25)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE}`);
  });
  
  await pool.close();
}

checkLicenses().catch(console.error);
