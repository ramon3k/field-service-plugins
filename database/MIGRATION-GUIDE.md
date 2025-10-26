# Full Database Migration to Azure SQL

This guide migrates your **complete** FieldServiceDB from local SQL Server Express to Azure SQL.

## What Gets Migrated

✅ **All tables with data:**
- Users
- Customers  
- Sites
- Assets
- Vendors
- Licenses
- Tickets
- ServiceRequests (already has schema patches applied)
- Attachments
- ActivityLog

## Prerequisites

1. Azure SQL Server: `customer-portal-sql-server.database.windows.net`
2. Azure SQL Database: `FieldServiceDB`
3. Azure SQL Admin user: `sqladmin`
4. Password for Azure SQL (you set this when creating the server)

## Quick Migration (Automated)

### Step 1: Set Azure SQL Password

```powershell
$env:AZURE_SQL_PASSWORD="yCustomerPortal2025!"
```

### Step 2: Run Migration Script

```powershell
cd database
node migrate-database-to-azure.cjs
```

This will:
- Connect to local `localhost\SQLEXPRESS\FieldServiceDB`
- Connect to Azure `customer-portal-sql-server.database.windows.net\FieldServiceDB`
- Create all missing tables in Azure
- Copy all data from local to Azure
- Save a backup SQL script to `FieldServiceDB-full-export.sql`

## Step 3: Apply Schema Patches

After migration, run these two patches in Azure Query Editor to ensure compatibility:

```powershell
# In Azure Portal > FieldServiceDB > Query editor:
# 1. Run: database/patch-service-requests-schema.sql
# 2. Run: database/patch-activity-log-schema.sql
```

## Step 4: Update Application Connections

### Main App (.env)

```properties
DB_SERVER=customer-portal-sql-server.database.windows.net
DB_NAME=FieldServiceDB
DB_USER=sqladmin
DB_PASSWORD=your-azure-sql-password
DB_ENCRYPT=true
```

### Customer Portal (already configured via Azure App Settings)

Already set via:
```
DB_SERVER=customer-portal-sql-server.database.windows.net
DB_NAME=FieldServiceDB
DB_USER=sqladmin
DB_PASSWORD=***
COMPANY_CODE=KIT
```

## Verification

Test locally that main app connects to Azure SQL:

```powershell
cd ..
npm start
```

Test customer portal submission:

```powershell
$body = @{
  CustomerName = "Migration Test"
  ContactEmail = "test@dcpsp.com"
  ContactPhone = "555-1234"
  SiteName = "Test Site"
  Address = "123 Test Ln"
  IssueDescription = "Testing after full DB migration"
  Priority = "High"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://customer-portal-linux.azurewebsites.net/api/service-requests/submit" `
  -Method POST -Body $body -ContentType "application/json"
```

## Alternative: Manual Migration via SSMS

If you prefer GUI tools:

1. Open SQL Server Management Studio (SSMS)
2. Connect to `localhost\SQLEXPRESS`
3. Right-click `FieldServiceDB` → **Tasks** → **Generate Scripts**
4. Choose **Schema and Data** for all tables
5. Save to `FieldServiceDB-full-export.sql`
6. Connect to `customer-portal-sql-server.database.windows.net` (SQL Auth: sqladmin)
7. Open and execute the script against Azure `FieldServiceDB`

## Troubleshooting

**Migration script fails with "Login failed":**
- Verify Azure SQL password is correct
- Check Azure SQL firewall allows your IP

**Tables already exist errors:**
- Script is idempotent; existing tables are skipped
- To start fresh: drop all tables in Azure first (except master)

**Data doesn't appear:**
- Check identity columns didn't block inserts
- Verify no foreign key constraint violations
- Review migration script output for errors

## What's Next

After successful migration:
1. ✅ Main app runs on Azure SQL (no more firewall/port forwarding issues)
2. ✅ Customer portal uses same database (integrated data)
3. ✅ All Azure-hosted (24/7 accessible)
4. 🎯 Bind custom domain `ssr.dcpsp.com` to portal
5. 🎯 Deploy main app to Azure (optional)
