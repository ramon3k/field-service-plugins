require('dotenv').config({ path: './server/.env' });
const sql = require('mssql');

async function checkTicketFormat() {
  const pool = await sql.connect({
    server: process.env.DB_SERVER,
    database: 'FieldServiceDB',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: { encrypt: true, trustServerCertificate: false }
  });
  
  const result = await pool.request().query(`
    SELECT TOP 5 TicketID, Title, Customer
    FROM Tickets 
    WHERE CompanyCode = 'DCPSP'
    ORDER BY CreatedAt DESC
  `);
  
  console.log('Sample DCPSP Ticket IDs:');
  result.recordset.forEach(t => {
    console.log(`  ${t.TicketID} - ${t.Title.substring(0, 50)}`);
  });
  
  await pool.close();
}

checkTicketFormat().catch(console.error);
