// Export ServiceRequests table and create it in Azure SQL Database
const sql = require('mssql');

// Local SQL Server Express config
const localConfig = {
    server: 'localhost\\SQLEXPRESS',
    database: 'FieldServiceDB',
    authentication: {
        type: 'default'
    },
    options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
    }
};

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

async function exportToAzure() {
    console.log('🔄 Starting migration to Azure SQL Database...\n');
    
    let localPool, azurePool;
    
    try {
        // Connect to local SQL Server
        console.log('📡 Connecting to local SQL Server Express...');
        localPool = await sql.connect(localConfig);
        console.log('✅ Connected to local SQL Server\n');
        
        // Connect to Azure SQL
        console.log('☁️  Connecting to Azure SQL Database...');
        azurePool = await sql.connect(azureConfig);
        console.log('✅ Connected to Azure SQL Database\n');
        
        // Create ServiceRequests table in Azure
        console.log('📋 Creating ServiceRequests table in Azure SQL...');
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
        await azurePool.request().query(createTableQuery);
        console.log('✅ ServiceRequests table created\n');
        
        // Get existing data from local SQL Server
        console.log('📥 Fetching existing service requests from local database...');
        const localResult = await localPool.request().query('SELECT * FROM ServiceRequests');
        const rowCount = localResult.recordset.length;
        console.log(`📊 Found ${rowCount} service requests to migrate\n`);
        
        // Insert data into Azure SQL if any exists
        if (rowCount > 0) {
            console.log('📤 Migrating data to Azure SQL Database...');
            for (const row of localResult.recordset) {
                const insertQuery = `
                    INSERT INTO ServiceRequests 
                    (CustomerName, CustomerEmail, CustomerPhone, SiteName, SiteAddress, 
                     IssueDescription, Priority, Status, SubmittedAt, CompanyCode)
                    VALUES 
                    (@CustomerName, @CustomerEmail, @CustomerPhone, @SiteName, @SiteAddress,
                     @IssueDescription, @Priority, @Status, @SubmittedAt, @CompanyCode)
                `;
                
                await azurePool.request()
                    .input('CustomerName', sql.NVarChar, row.CustomerName)
                    .input('CustomerEmail', sql.NVarChar, row.CustomerEmail)
                    .input('CustomerPhone', sql.NVarChar, row.CustomerPhone)
                    .input('SiteName', sql.NVarChar, row.SiteName)
                    .input('SiteAddress', sql.NVarChar, row.SiteAddress)
                    .input('IssueDescription', sql.NVarChar, row.IssueDescription)
                    .input('Priority', sql.NVarChar, row.Priority)
                    .input('Status', sql.NVarChar, row.Status)
                    .input('SubmittedAt', sql.DateTime, row.SubmittedAt)
                    .input('CompanyCode', sql.NVarChar, row.CompanyCode)
                    .query(insertQuery);
            }
            console.log(`✅ Migrated ${rowCount} service requests to Azure SQL\n`);
        }
        
        // Verify the migration
        console.log('🔍 Verifying migration...');
        const azureResult = await azurePool.request().query('SELECT COUNT(*) AS Count FROM ServiceRequests');
        const azureCount = azureResult.recordset[0].Count;
        console.log(`✅ Azure SQL Database now has ${azureCount} service requests\n`);
        
        console.log('🎉 Migration completed successfully!');
        console.log('\n📝 Connection details for Azure App Service:');
        console.log('   DB_SERVER=customer-portal-sql-server.database.windows.net');
        console.log('   DB_NAME=FieldServiceDB');
        console.log('   DB_USER=sqladmin');
        console.log('   DB_PASSWORD=CustomerPortal2025!');
        
    } catch (err) {
        console.error('\n❌ Error during migration:', err.message);
        throw err;
    } finally {
        if (localPool) await localPool.close();
        if (azurePool) await azurePool.close();
    }
}

// Run the export
exportToAzure()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
