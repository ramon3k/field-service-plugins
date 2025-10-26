// Test Azure SQL Database connection and check if ServiceRequests table exists
const sql = require('mssql');

const azureConfig = {
    server: 'customer-portal-sql-server.database.windows.net',
    database: 'FieldServiceDB',
    user: 'sqladmin',
    password: 'CustomerPortal2025!',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000
    }
};

async function testDatabase() {
    console.log('🔍 Testing Azure SQL Database...\n');
    
    try {
        console.log('☁️  Connecting to Azure SQL Database...');
        const pool = await sql.connect(azureConfig);
        console.log('✅ Connected successfully!\n');
        
        // Check if ServiceRequests table exists
        console.log('📋 Checking for ServiceRequests table...');
        const tableCheck = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'ServiceRequests'
        `);
        
        if (tableCheck.recordset.length > 0) {
            console.log('✅ ServiceRequests table EXISTS\n');
            
            // Get table structure
            console.log('📊 Table structure:');
            const columns = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'ServiceRequests'
                ORDER BY ORDINAL_POSITION
            `);
            
            columns.recordset.forEach(col => {
                const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
                const maxLen = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
                console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${maxLen} ${nullable}`);
            });
            
            // Check for existing data
            console.log('\n📈 Checking for data...');
            const count = await pool.request().query('SELECT COUNT(*) AS Count FROM ServiceRequests');
            console.log(`   Rows in table: ${count.recordset[0].Count}\n`);
            
            // Test INSERT
            console.log('🧪 Testing INSERT...');
            const insertResult = await pool.request()
                .input('CustomerName', sql.NVarChar, 'Test Customer')
                .input('CustomerEmail', sql.NVarChar, 'test@example.com')
                .input('CustomerPhone', sql.NVarChar, '555-1234')
                .input('SiteName', sql.NVarChar, 'Test Site')
                .input('SiteAddress', sql.NVarChar, '123 Test St')
                .input('IssueDescription', sql.NVarChar, 'Test issue from verification script')
                .input('Priority', sql.NVarChar, 'High')
                .input('CompanyCode', sql.NVarChar, 'KIT')
                .query(`
                    INSERT INTO ServiceRequests 
                    (CustomerName, CustomerEmail, CustomerPhone, SiteName, SiteAddress, IssueDescription, Priority, CompanyCode)
                    OUTPUT INSERTED.RequestID
                    VALUES 
                    (@CustomerName, @CustomerEmail, @CustomerPhone, @SiteName, @SiteAddress, @IssueDescription, @Priority, @CompanyCode)
                `);
            
            const newId = insertResult.recordset[0].RequestID;
            console.log(`✅ INSERT successful! New RequestID: ${newId}\n`);
            
            // Verify the insert
            const verify = await pool.request()
                .input('RequestID', sql.Int, newId)
                .query('SELECT * FROM ServiceRequests WHERE RequestID = @RequestID');
            
            console.log('📝 Inserted record:');
            console.log(verify.recordset[0]);
            
            console.log('\n🎉 Database is working perfectly!');
            
        } else {
            console.log('❌ ServiceRequests table DOES NOT EXIST!');
            console.log('\n🔧 Need to create the table...');
        }
        
        await pool.close();
        
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('Full error:', err);
    }
}

testDatabase()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
