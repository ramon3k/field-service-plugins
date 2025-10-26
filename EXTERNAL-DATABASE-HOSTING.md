# External Database Hosting Guide
**Multi-Tenant Architecture with Customer-Hosted Databases**

## Overview

Your multi-tenant system supports **customers hosting their own databases** on their own servers. The `Tenants` table in `TenantRegistry` includes a `DatabaseServer` field that specifies where each tenant's database is located.

---

## Architecture: Hybrid Multi-Tenancy

### Your Infrastructure (Centralized)
- **TenantRegistry Database** - You host this (tracks all tenants)
- **Your API Server** - Routes requests to appropriate databases
- **Demo Databases** - You host these for sales demonstrations
- **Your Production Database** - DCPSP company data

### Customer Infrastructure (Distributed)
- **Customer's SQL Server** - They host their own database
- **Customer's Network** - Database sits behind their firewall
- **Customer's Backups** - They manage their own data backups
- **Customer's Compliance** - Meets their regulatory requirements

---

## Configuration Examples

### Scenario 1: Customer with Azure SQL Database

```sql
-- Customer: ACME Corp hosts their own Azure SQL database
INSERT INTO TenantRegistry.dbo.Tenants (
    CompanyCode, 
    CompanyName, 
    DatabaseName, 
    DatabaseServer,
    IsActive,
    Notes
)
VALUES (
    'ACME', 
    'ACME Corporation', 
    'FieldServiceDB_ACME',
    'acme-sql-server.database.windows.net',  -- Their Azure SQL server
    1,
    'Customer-hosted Azure SQL Database'
);
```

### Scenario 2: Customer with On-Premises SQL Server

```sql
-- Customer: TechStart hosts on-premises SQL Server (publicly accessible)
INSERT INTO TenantRegistry.dbo.Tenants (
    CompanyCode, 
    CompanyName, 
    DatabaseName, 
    DatabaseServer,
    IsActive,
    Notes
)
VALUES (
    'TECHSTART', 
    'TechStart Industries', 
    'FieldServiceDB',
    'sql.techstart.com,1433',  -- Their public SQL Server endpoint
    1,
    'Customer on-premises SQL Server with VPN access'
);
```

### Scenario 3: Customer with AWS RDS SQL Server

```sql
-- Customer: GlobalSec uses AWS RDS
INSERT INTO TenantRegistry.dbo.Tenants (
    CompanyCode, 
    CompanyName, 
    DatabaseName, 
    DatabaseServer,
    IsActive,
    Notes
)
VALUES (
    'GLOBALSEC', 
    'GlobalSec Security', 
    'FieldServiceDB',
    'globalsec-db.abc123.us-east-1.rds.amazonaws.com',  -- AWS RDS endpoint
    1,
    'Customer AWS RDS SQL Server instance'
);
```

---

## How It Works

### 1. Request Flow

```
User Request
    ↓
Frontend (includes ?company=ACME)
    ↓
API Server (tenant-middleware.js)
    ↓
Query TenantRegistry for ACME config
    ↓
Get: DatabaseServer = "acme-sql-server.database.windows.net"
     DatabaseName = "FieldServiceDB_ACME"
    ↓
Create/Get connection pool to acme-sql-server.database.windows.net
    ↓
Execute query on customer's database
    ↓
Return results to user
```

### 2. Connection Manager Behavior

The `tenant-connection-manager.js` already handles multiple servers:

```javascript
// Simplified version showing how it works
async getPool(companyCode) {
  // Get tenant config from registry
  const tenant = await this.getTenantConfig(companyCode);
  
  // tenant.DatabaseServer could be ANY server:
  // - customer-portal-sql-server.database.windows.net (your server)
  // - acme-sql-server.database.windows.net (ACME's server)
  // - sql.techstart.com (TechStart's server)
  // - etc.
  
  const poolConfig = {
    server: tenant.DatabaseServer,      // Customer's server
    database: tenant.DatabaseName,       // Customer's database
    user: process.env.DB_USER,          // Credentials (see below)
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };
  
  // Create connection pool to customer's server
  const pool = await sql.connect(poolConfig);
  return pool;
}
```

---

## Authentication Methods

### Option 1: Shared Credentials (Simplest)
You use the same SQL authentication across all customer databases.

**Customer Setup:**
```sql
-- Customer creates a SQL login for you on their server
CREATE LOGIN fieldservice_api WITH PASSWORD = 'SecurePassword123!';

-- Customer grants access to their database
USE FieldServiceDB_ACME;
CREATE USER fieldservice_api FOR LOGIN fieldservice_api;
ALTER ROLE db_datareader ADD MEMBER fieldservice_api;
ALTER ROLE db_datawriter ADD MEMBER fieldservice_api;
```

**Your .env:**
```env
DB_USER=fieldservice_api
DB_PASSWORD=SecurePassword123!
```

**Pros:**
- Simple configuration
- One set of credentials

**Cons:**
- All customers must use same username/password
- Security risk if credentials leak

---

### Option 2: Per-Customer Credentials (More Secure)

Store different credentials for each customer in the Tenant Registry.

**Enhanced Tenant Table:**
```sql
-- Add columns to Tenants table
ALTER TABLE TenantRegistry.dbo.Tenants
ADD DbUsername NVARCHAR(128) NULL,
    DbPasswordHash NVARCHAR(255) NULL;  -- Store encrypted!
```

**Customer-Specific Credentials:**
```sql
-- ACME uses their own credentials
UPDATE TenantRegistry.dbo.Tenants
SET DbUsername = 'acme_api_user',
    DbPasswordHash = '...'  -- Encrypted password
WHERE CompanyCode = 'ACME';

-- TechStart uses different credentials
UPDATE TenantRegistry.dbo.Tenants
SET DbUsername = 'techstart_readonly',
    DbPasswordHash = '...'  -- Encrypted password
WHERE CompanyCode = 'TECHSTART';
```

**Updated Connection Manager:**
```javascript
// In tenant-connection-manager.js
async getPool(companyCode) {
  const tenant = await this.getTenantConfig(companyCode);
  
  const poolConfig = {
    server: tenant.DatabaseServer,
    database: tenant.DatabaseName,
    user: tenant.DbUsername || process.env.DB_USER,  // Per-customer or default
    password: this.decryptPassword(tenant.DbPasswordHash) || process.env.DB_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };
  
  const pool = await sql.connect(poolConfig);
  return pool;
}
```

---

### Option 3: Azure Managed Identity (Best for Azure)

Use Azure AD authentication instead of SQL passwords.

**Your App Service:**
- Enable System-assigned Managed Identity
- Each customer grants your managed identity access to their database

**Customer Setup:**
```sql
-- Customer grants access to your Azure App Service
CREATE USER [your-app-service-name] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [your-app-service-name];
ALTER ROLE db_datawriter ADD MEMBER [your-app-service-name];
```

**Connection Config:**
```javascript
const poolConfig = {
  server: tenant.DatabaseServer,
  database: tenant.DatabaseName,
  authentication: {
    type: 'azure-active-directory-managed-identity'
  },
  options: {
    encrypt: true
  }
};
```

**Pros:**
- No passwords to manage
- Automatic credential rotation
- Best security practice

**Cons:**
- Only works for Azure-hosted databases
- Requires Azure AD setup

---

## Network Connectivity

### Firewall Rules Required

Customers must allow connections from your API server.

#### Azure SQL Database
```sql
-- Customer adds your Azure App Service IP to firewall
-- In Azure Portal → SQL Server → Networking → Firewall rules
-- Add rule: YourAppService → 20.123.45.67
```

#### On-Premises SQL Server
```
1. Enable SQL Server TCP/IP protocol
2. Configure firewall to allow port 1433
3. Use static IP or VPN for security
4. Consider Azure ExpressRoute for enterprise customers
```

#### VPN/Private Connectivity (Enterprise)
```
- Azure VNet Peering (if both in Azure)
- Site-to-Site VPN
- Azure ExpressRoute
- Private Link/Private Endpoint
```

---

## Customer Onboarding Process

### Step 1: Customer Provisions Database

**Option A: Customer Creates Database**
```sql
-- Customer creates database on their SQL Server
CREATE DATABASE FieldServiceDB_ACME;
GO

-- Customer runs your schema script
-- (You provide them with database/setup-demo-database.sql modified for production)
USE FieldServiceDB_ACME;
-- Run schema creation...
```

**Option B: You Provide Database Backup**
```bash
# You create a clean database backup
# Customer restores it on their server
RESTORE DATABASE FieldServiceDB_ACME
FROM DISK = 'path/to/FieldServiceDB_Template.bak'
WITH MOVE 'FieldServiceDB' TO 'D:\Data\FieldServiceDB_ACME.mdf',
     MOVE 'FieldServiceDB_log' TO 'E:\Logs\FieldServiceDB_ACME_log.ldf';
```

### Step 2: Customer Creates API User

```sql
-- Customer creates SQL login for your API
CREATE LOGIN fieldservice_api WITH PASSWORD = 'SecurePassword123!';

USE FieldServiceDB_ACME;
CREATE USER fieldservice_api FOR LOGIN fieldservice_api;

-- Grant necessary permissions
ALTER ROLE db_datareader ADD MEMBER fieldservice_api;
ALTER ROLE db_datawriter ADD MEMBER fieldservice_api;
GRANT EXECUTE TO fieldservice_api;  -- For stored procedures
```

### Step 3: Customer Provides Connection Details

Customer sends you (securely):
- **Server**: `acme-sql-server.database.windows.net`
- **Database**: `FieldServiceDB_ACME`
- **Username**: `fieldservice_api`
- **Password**: `SecurePassword123!`

### Step 4: You Add Tenant to Registry

```sql
INSERT INTO TenantRegistry.dbo.Tenants (
    CompanyCode,
    CompanyName,
    DatabaseName,
    DatabaseServer,
    IsActive,
    Notes
)
VALUES (
    'ACME',
    'ACME Corporation',
    'FieldServiceDB_ACME',
    'acme-sql-server.database.windows.net',
    1,
    'Customer-hosted Azure SQL Database - Onboarded Oct 2025'
);
```

### Step 5: Test Connection

```bash
# Test from your server
curl "https://your-api.azurewebsites.net/api/health/tenants"

# Should show ACME in the list with "connected": true
```

### Step 6: Customer Tests

```
Customer URL: https://yourapp.com/login?company=ACME
Customer logs in with their credentials
Data loads from their own database
```

---

## Schema Management

### Initial Schema Deployment

**Option 1: Provide SQL Script**
```sql
-- You maintain: database/production-schema.sql
-- Customer runs it on their server to create all tables, indexes, etc.
```

**Option 2: Provide Database Template**
```bash
# You maintain a clean .bak file with schema but no data
# Customer restores it
```

### Schema Updates

When you release new features requiring schema changes:

**Option 1: SQL Migration Scripts**
```sql
-- migration-v1.1-add-service-plans.sql
ALTER TABLE Tickets ADD ServicePlanID INT NULL;
CREATE TABLE ServicePlans (...);
-- etc.
```

**Option 2: Automated Migrations**
```javascript
// In your API startup
const migrations = [
  { version: '1.1', file: 'migration-v1.1.sql' },
  { version: '1.2', file: 'migration-v1.2.sql' }
];

// Check customer's schema version and apply missing migrations
```

**Communication:**
```
Email to customers:
"Version 1.1 Release - Database Update Required
Please run the attached migration script on your database before Nov 1st."
```

---

## Security Considerations

### 1. Credential Storage

**DO NOT** store passwords in plain text:

```javascript
// WRONG - Plain text password
const tenant = {
  DbPassword: 'SecurePassword123!'
};

// RIGHT - Encrypted password
const tenant = {
  DbPasswordHash: 'encrypted-base64-string'
};

// Decrypt when needed
const password = decrypt(tenant.DbPasswordHash, process.env.ENCRYPTION_KEY);
```

### 2. Use Azure Key Vault

```javascript
const { SecretClient } = require('@azure/keyvault-secrets');

// Store customer credentials in Key Vault
const secretName = `db-password-${companyCode}`;
const secret = await keyVaultClient.getSecret(secretName);
const password = secret.value;
```

### 3. Connection String Validation

```javascript
// Prevent SQL injection in connection strings
function validateServer(serverName) {
  // Allow only valid DNS names or IP addresses
  const validPattern = /^[a-zA-Z0-9.-]+$/;
  if (!validPattern.test(serverName)) {
    throw new Error('Invalid server name');
  }
  return serverName;
}
```

### 4. Network Security

- Use SSL/TLS for all connections (`encrypt: true`)
- Require customer databases to have firewall rules
- Consider VPN for highly sensitive customers
- Use private endpoints for Azure SQL

---

## Monitoring & Health Checks

### Enhanced Health Check

Add database server info to health endpoint:

```javascript
// In tenant-middleware.js
function getTenantHealthCheck(req, res) {
  const status = connectionManager.getStatus();
  
  // Add server information
  const enhancedStatus = {
    ...status,
    tenants: status.tenants.map(t => ({
      ...t,
      serverLocation: t.database.includes('your-server') ? 'Your Server' : 'Customer Hosted'
    }))
  };
  
  res.json(enhancedStatus);
}
```

### Response Example:
```json
{
  "activePools": 3,
  "cachedConfigs": 3,
  "tenants": [
    {
      "companyCode": "DCPSP",
      "connected": true,
      "database": "FieldServiceDB",
      "server": "customer-portal-sql-server.database.windows.net",
      "serverLocation": "Your Server"
    },
    {
      "companyCode": "ACME",
      "connected": true,
      "database": "FieldServiceDB_ACME",
      "server": "acme-sql-server.database.windows.net",
      "serverLocation": "Customer Hosted"
    },
    {
      "companyCode": "DEMO",
      "connected": true,
      "database": "FieldServiceDB_Demo",
      "server": "customer-portal-sql-server.database.windows.net",
      "serverLocation": "Your Server"
    }
  ]
}
```

---

## Performance Considerations

### Connection Pooling

Each customer gets their own connection pool:

```javascript
// In tenant-connection-manager.js
this.pools = new Map();
// Key: 'ACME' → Value: Pool to acme-sql-server.database.windows.net
// Key: 'TECHSTART' → Value: Pool to sql.techstart.com
// Key: 'DCPSP' → Value: Pool to customer-portal-sql-server.database.windows.net
```

**Benefits:**
- Efficient connections to multiple servers
- Automatic connection reuse
- Graceful handling of server outages

### Latency Considerations

- **Your Server**: ~10-20ms (same region)
- **Customer Azure SQL**: ~20-50ms (same region)
- **Customer On-Premises**: ~50-200ms (internet connection)
- **Customer International**: ~200-500ms (cross-continent)

**Optimization:**
- Deploy your API in multiple regions
- Use CDN for frontend assets
- Implement query caching for slow connections

---

## Cost Analysis

### Your Costs

| Item | Cost |
|------|------|
| TenantRegistry (Basic) | $5/month |
| Your Production DB (Standard S0) | $15/month |
| Demo Databases (2x Basic) | $10/month |
| **Total** | **$30/month** |

### Customer Costs

Each customer pays for their own:
- SQL Server license or Azure SQL database
- Storage
- Backups
- Networking/VPN (if needed)

**Your benefit**: You don't pay for customer storage as they scale!

---

## Advantages of Customer-Hosted Databases

### For You:
✅ **Lower hosting costs** - Customers pay for their own databases
✅ **Better scalability** - No database size limits on your end
✅ **Simplified compliance** - Customer data stays in their infrastructure
✅ **Disaster recovery** - Customer manages their own backups

### For Customers:
✅ **Data sovereignty** - Data stays on their servers/region
✅ **Control** - They manage backups, security, compliance
✅ **Performance** - Can upgrade their own database tier
✅ **Integration** - Easier to integrate with other on-premises systems
✅ **Compliance** - Meets regulatory requirements (HIPAA, SOC2, etc.)

---

## Disadvantages & Mitigation

### Challenge 1: Network Reliability
**Problem**: Customer database offline = service down
**Mitigation**: 
- SLA requirements in contract
- Health monitoring alerts
- Fallback to cached data

### Challenge 2: Schema Version Drift
**Problem**: Customers on different schema versions
**Mitigation**:
- Version detection in API
- Graceful degradation for older schemas
- Mandatory update windows

### Challenge 3: Performance Variation
**Problem**: Slow customer databases affect user experience
**Mitigation**:
- Query timeout limits
- Performance metrics per tenant
- Customer reporting/recommendations

### Challenge 4: Support Complexity
**Problem**: Can't directly access customer data for troubleshooting
**Mitigation**:
- Comprehensive logging
- Customer-side diagnostics tools
- Screen sharing for support sessions

---

## Example: Complete Customer Setup

### Scenario: Onboarding "Sunshine HVAC"

**1. Sunshine provisions Azure SQL database:**
```sql
-- On sunshine-sql.database.windows.net
CREATE DATABASE FieldServiceDB_Sunshine;
```

**2. Sunshine runs your schema script:**
```bash
sqlcmd -S sunshine-sql.database.windows.net -U admin -P pass -i production-schema.sql
```

**3. Sunshine creates API user:**
```sql
CREATE LOGIN fieldservice_api WITH PASSWORD = 'SunshineAPI2025!';
USE FieldServiceDB_Sunshine;
CREATE USER fieldservice_api FOR LOGIN fieldservice_api;
ALTER ROLE db_datareader ADD MEMBER fieldservice_api;
ALTER ROLE db_datawriter ADD MEMBER fieldservice_api;
```

**4. Sunshine configures firewall:**
```
Azure Portal → SQL Server → Networking
Add firewall rule: YourAppService → 20.123.45.67
```

**5. Sunshine sends you connection details securely**

**6. You add tenant:**
```sql
INSERT INTO TenantRegistry.dbo.Tenants 
(CompanyCode, CompanyName, DatabaseName, DatabaseServer)
VALUES 
('SUNSHINE', 'Sunshine HVAC Services', 'FieldServiceDB_Sunshine', 'sunshine-sql.database.windows.net');
```

**7. You test:**
```bash
curl "https://your-api.azurewebsites.net/api/tickets?company=SUNSHINE"
```

**8. Sunshine users access:**
```
URL: https://yourapp.com/login?company=SUNSHINE
Their data loads from sunshine-sql.database.windows.net
```

**Done!** ✅

---

## Troubleshooting

### "Cannot connect to customer database"

**Check:**
1. Firewall rules allow your IP
2. Credentials are correct
3. Database server is online
4. Network connectivity (ping/telnet)

```bash
# Test connection from your server
telnet sunshine-sql.database.windows.net 1433
```

### "Login failed for user"

**Check:**
1. Username/password correct in TenantRegistry
2. User has permissions on that specific database
3. SQL authentication enabled (not Windows-only)

### "Database does not exist"

**Check:**
1. DatabaseName in TenantRegistry matches actual database name
2. Database is online (not paused in Azure)

---

## Best Practices

### 1. Customer Agreement Template
Include in your contract:
- Minimum database uptime SLA (99.9%)
- Required firewall access for your IPs
- Schema update compliance timeline
- Backup/disaster recovery requirements

### 2. Monitoring
- Set up alerts for failed tenant connections
- Log connection attempts and failures
- Monthly reports to customers on performance

### 3. Documentation
Provide customers with:
- Schema creation scripts
- Migration scripts for updates
- Firewall configuration guide
- Troubleshooting checklist

### 4. Testing
Before going live with each customer:
- Test connection from your production environment
- Verify all API endpoints work
- Load test with expected usage
- Document connection details securely

---

## Summary

Your multi-tenant system **already supports** customer-hosted databases! 

### Quick Setup:
1. Customer provisions SQL Server/Azure SQL
2. Customer creates database and API user
3. Customer configures firewall
4. You add entry to `TenantRegistry` with their server address
5. Your API automatically routes requests to their database

### Key Files:
- ✅ `tenant-connection-manager.js` - Already handles multiple servers
- ✅ `database/setup-multi-tenant.sql` - `DatabaseServer` field exists
- ✅ No code changes needed!

The system is **production-ready** for external database hosting! 🎉
