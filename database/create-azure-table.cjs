// Create ServiceRequests table in Azure SQL Database
const sql = require('mssql');

// Azure SQL Database config
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

async function createTable() {
    console.log('🔄 Creating ServiceRequests table in Azure SQL Database...\n');
    
    try {
        // Connect to Azure SQL
        console.log('☁️  Connecting to Azure SQL Database...');
        const pool = await sql.connect(azureConfig);
        console.log('✅ Connected to Azure SQL Database\n');
        
        // Create ServiceRequests table
        console.log('📋 Creating ServiceRequests table...');
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ServiceRequests' AND xtype='U')
            CREATE TABLE ServiceRequests (
                RequestID INT IDENTITY(1,1) PRIMARY KEY,
                CustomerName NVARCHAR(100) NOT NULL,
                CustomerEmail NVARCHAR(100),
                CustomerPhone NVARCHAR(20),
                SiteName NVARCHAR(200),
                SiteAddress NVARCHAR(500),
                IssueDescription NVARCHAR(MAX) NOT NULL,
                Priority NVARCHAR(20) DEFAULT 'Medium',
                Status NVARCHAR(20) DEFAULT 'Pending',
                SubmittedAt DATETIME DEFAULT GETDATE(),
                CompanyCode NVARCHAR(10) DEFAULT 'KIT'
            )
        `;
        await pool.request().query(createTableQuery);
        console.log('✅ ServiceRequests table created successfully\n');
        
        console.log('🎉 Setup completed!');
        console.log('\n📝 Connection details for Azure App Service:');
        console.log('   DB_SERVER=customer-portal-sql-server.database.windows.net');
        console.log('   DB_NAME=FieldServiceDB');
        console.log('   DB_USER=sqladmin');
        console.log('   DB_PASSWORD=CustomerPortal2025!\n');
        
        await pool.close();
        
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        throw err;
    }
}

// Run the script
createTable()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
