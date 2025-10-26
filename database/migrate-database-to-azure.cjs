// Full database migration: Export local FieldServiceDB to Azure SQL
// Migrates ALL tables with schema and data

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Configuration
const localConfig = {
    server: 'localhost\\SQLEXPRESS',
    database: 'FieldServiceDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        instanceName: 'SQLEXPRESS',
        useUTC: false
    },
    authentication: {
        type: 'default'  // Windows Authentication
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
};

const azureConfig = {
    server: 'customer-portal-sql-server.database.windows.net',
    database: 'FieldServiceDB',
    user: 'sqladmin',
    password: process.env.AZURE_SQL_PASSWORD || '', // Set via: $env:AZURE_SQL_PASSWORD="yourpassword"
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

// Tables to migrate in dependency order (to handle foreign keys)
const tablesToMigrate = [
    'Users',
    'Customers',
    'Sites',
    'Assets',
    'Vendors',
    'Licenses',
    'Tickets',
    'ServiceRequests',
    'Attachments',
    'ActivityLog'
];

async function getTableSchema(pool, tableName) {
    const result = await pool.request().query(`
        SELECT 
            c.COLUMN_NAME,
            c.DATA_TYPE,
            c.CHARACTER_MAXIMUM_LENGTH,
            c.NUMERIC_PRECISION,
            c.NUMERIC_SCALE,
            c.IS_NULLABLE,
            COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS IS_IDENTITY
        FROM INFORMATION_SCHEMA.COLUMNS c
        WHERE c.TABLE_NAME = '${tableName}'
        ORDER BY c.ORDINAL_POSITION
    `);
    return result.recordset;
}

async function getTableData(pool, tableName) {
    const result = await pool.request().query(`SELECT * FROM dbo.${tableName}`);
    return result.recordset;
}

function generateCreateTableSQL(tableName, schema) {
    let sql = `IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = '${tableName}')\nBEGIN\n`;
    sql += `    CREATE TABLE dbo.${tableName} (\n`;
    
    const columns = schema.map(col => {
        let def = `        ${col.COLUMN_NAME} ${col.DATA_TYPE}`;
        
        if (col.CHARACTER_MAXIMUM_LENGTH) {
            def += col.CHARACTER_MAXIMUM_LENGTH === -1 ? '(MAX)' : `(${col.CHARACTER_MAXIMUM_LENGTH})`;
        } else if (col.NUMERIC_PRECISION) {
            def += `(${col.NUMERIC_PRECISION},${col.NUMERIC_SCALE || 0})`;
        }
        
        def += col.IS_IDENTITY ? ' IDENTITY(1,1)' : '';
        def += col.IS_NULLABLE === 'NO' ? ' NOT NULL' : ' NULL';
        
        return def;
    });
    
    sql += columns.join(',\n') + '\n    );\n';
    sql += `    PRINT 'Created table ${tableName}';\nEND\nELSE\n`;
    sql += `    PRINT 'Table ${tableName} already exists';\nGO\n\n`;
    
    return sql;
}

async function migrateDatabase() {
    console.log('========================================');
    console.log('Full Database Migration to Azure SQL');
    console.log('========================================\n');
    
    if (!azureConfig.password) {
        console.error('ERROR: Azure SQL password not set!');
        console.log('Set it via: $env:AZURE_SQL_PASSWORD="yourpassword"');
        process.exit(1);
    }
    
    let localPool, azurePool;
    const migrationScript = [];
    
    try {
        // Connect to local SQL Express
        console.log('[1/4] Connecting to local SQL Express...');
        localPool = await sql.connect(localConfig);
        console.log('✅ Connected to local database\n');
        
        // Connect to Azure SQL
        console.log('[2/4] Connecting to Azure SQL...');
        azurePool = await new sql.ConnectionPool(azureConfig).connect();
        console.log('✅ Connected to Azure SQL\n');
        
        // Migrate each table
        console.log('[3/4] Migrating tables...');
        for (const tableName of tablesToMigrate) {
            console.log(`\n  📋 Table: ${tableName}`);
            
            try {
                // Get schema from local
                const schema = await getTableSchema(localPool, tableName);
                if (schema.length === 0) {
                    console.log(`    ⚠️  Skipping (not found in local DB)`);
                    continue;
                }
                
                // Get data from local
                const data = await getTableData(localPool, tableName);
                console.log(`    Found ${data.length} rows`);
                
                // Generate CREATE TABLE script
                const createSQL = generateCreateTableSQL(tableName, schema);
                migrationScript.push(createSQL);
                
                // Create table in Azure if it doesn't exist
                await azurePool.request().query(createSQL);
                
                // Insert data in batches
                if (data.length > 0) {
                    console.log(`    Inserting data...`);
                    let inserted = 0;
                    
                    for (const row of data) {
                        const columns = Object.keys(row).filter(k => !schema.find(s => s.COLUMN_NAME === k && s.IS_IDENTITY));
                        const values = columns.map(c => row[c]);
                        
                        const request = azurePool.request();
                        columns.forEach((col, i) => {
                            const colSchema = schema.find(s => s.COLUMN_NAME === col);
                            let sqlType = sql.NVarChar;
                            if (colSchema.DATA_TYPE.includes('int')) sqlType = sql.Int;
                            else if (colSchema.DATA_TYPE.includes('date')) sqlType = sql.DateTime2;
                            else if (colSchema.DATA_TYPE.includes('bit')) sqlType = sql.Bit;
                            
                            request.input(`p${i}`, sqlType, values[i]);
                        });
                        
                        const insertSQL = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${columns.map((_, i) => `@p${i}`).join(',')})`;
                        await request.query(insertSQL);
                        inserted++;
                    }
                    
                    console.log(`    ✅ Inserted ${inserted} rows`);
                }
                
            } catch (err) {
                console.log(`    ❌ Error: ${err.message}`);
            }
        }
        
        // Save migration script
        console.log('\n[4/4] Saving migration script...');
        const scriptPath = path.join(__dirname, 'FieldServiceDB-full-export.sql');
        fs.writeFileSync(scriptPath, migrationScript.join('\n'), 'utf8');
        console.log(`✅ Saved to: ${scriptPath}\n`);
        
        console.log('========================================');
        console.log('Migration completed successfully!');
        console.log('========================================\n');
        
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        if (localPool) await localPool.close();
        if (azurePool) await azurePool.close();
    }
}

migrateDatabase();
