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

async function getSchema() {
  const pool = await sql.connect(config);
  
  try {
    const tables = ['Vendors', 'Licenses'];
    
    for (const table of tables) {
      console.log(`\n${table} columns:`);
      const result = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${table}'
        ORDER BY ORDINAL_POSITION
      `);
      
      result.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
  } finally {
    await pool.close();
  }
}

getSchema();
