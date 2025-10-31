# Data Migration Guide - SQL Server Management Studio (SSMS)

## Why SSMS?
SSMS handles Windows Authentication perfectly and can export both schema and data in one step. This is the most reliable method for migrating your existing users, customers, tickets, and all other data.

## Prerequisites
- SQL Server Management Studio (SSMS) installed
- Access to local SQL Express: `localhost\SQLEXPRESS`
- Azure SQL credentials: `sqladmin` / `CustomerPortal2025!`

## Step 1: Export Data from Local SQL Express

1. **Open SSMS**
2. **Connect to Local Server:**
   - Server name: `localhost\SQLEXPRESS`
   - Authentication: Windows Authentication
   - Click Connect

3. **Generate Export Script:**
   - In Object Explorer, expand "Databases"
   - Right-click `FieldServiceDB`
   - Select **Tasks** → **Generate Scripts...**

4. **Script Configuration:**
   - **Choose Objects:** 
     - Select "Select specific database objects"
     - Expand "Tables" and check these tables:
       ☑ Users
       ☑ Customers
       ☑ Sites
       ☑ Assets
       ☑ Vendors
       ☑ Licenses
       ☑ Tickets
       ☑ CoordinatorNotes
       ☑ AuditTrail
     - Click Next

   - **Set Scripting Options:**
     - Click "Advanced" button
     - Change these settings:
       - **Types of data to script:** `Schema and data` (NOT just Schema!)
       - **Script for Server Version:** `SQL Server 2019` or `SQL Azure Database`
       - **Script Indexes:** `True`
       - **Script Primary Keys:** `True`
       - **Script Foreign Keys:** `True`
     - Click OK
     - Choose "Save to file" → specify location (e.g., `C:\Temp\FieldServiceDB-Export.sql`)
     - Click Next → Next → Finish

5. **Script Generated!**
   - SSMS will create a complete SQL script with all data
   - File location: Check the path you specified

## Step 2: Import Data to Azure SQL

1. **Connect to Azure SQL in SSMS:**
   - File → Connect Object Explorer
   - Server name: `customer-portal-sql-server.database.windows.net`
   - Authentication: **SQL Server Authentication**
   - Login: `sqladmin`
   - Password: `CustomerPortal2025!`
   - Click Connect

2. **Open and Execute Script:**
   - File → Open → Select `FieldServiceDB-Export.sql`
   - In the toolbar, make sure target database is `FieldServiceDB`
   - Click **Execute** (F5)
   - Monitor progress in Messages tab

3. **Handle Errors (if any):**
   - **"Table already exists"**: Safe to ignore (tables were created by azure-create-full-schema.sql)
   - **Foreign key errors**: Data might be importing out of order; re-run problematic sections
   - **Identity insert errors**: May need to enable `SET IDENTITY_INSERT TableName ON` before inserts

## Step 3: Verify Data Migration

In Azure SQL Query Editor (Azure Portal):

```sql
-- Check record counts
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM Users
UNION ALL
SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL
SELECT 'Sites', COUNT(*) FROM Sites
UNION ALL
SELECT 'Tickets', COUNT(*) FROM Tickets
UNION ALL
SELECT 'Assets', COUNT(*) FROM Assets
UNION ALL
SELECT 'Vendors', COUNT(*) FROM Vendors
UNION ALL
SELECT 'Licenses', COUNT(*) FROM Licenses;

-- Verify you can login (check Users table)
SELECT Username, Email, Role, IsActive FROM Users;

-- Check CompanyCode values
SELECT DISTINCT CompanyCode FROM Users;
SELECT DISTINCT CompanyCode FROM Customers;
```

## Step 4: Test Main App with Azure SQL

Your `.env` has been updated to point to Azure SQL. Now test:

```powershell
cd server
node api.js
```

Expected output:
- ✅ Connected to Azure SQL
- ✅ Server running on port 5000
- Login at: http://localhost:5000

## Alternative Method: Import/Export Wizard

If Generate Scripts doesn't work, use the Import/Export Wizard:

1. **Export BACPAC from Local:**
   - Right-click `FieldServiceDB` → Tasks → **Export Data-tier Application**
   - Save as: `FieldServiceDB.bacpac`

2. **Import BACPAC to Azure:**
   - Connect to Azure SQL server
   - Right-click "Databases" → **Import Data-tier Application**
   - Select `FieldServiceDB.bacpac`
   - Target database: `FieldServiceDB` (will overwrite)
   - Click Import

## Troubleshooting

**"Cannot connect to Azure SQL from SSMS":**
- Check Azure SQL firewall allows your IP
- Azure Portal → SQL databases → FieldServiceDB → Set server firewall
- Add your current client IP

**"Login failed for user 'sqladmin'":**
- Verify password: `CustomerPortal2025!`
- Check caps lock is off
- Try connecting via Azure Portal Query Editor first

**"Data imported but can't login to app":**
- Verify user passwords were migrated
- Check COMPANY_CODE='KIT' in all records
- Reset admin password if needed

## Next Steps

After successful migration:
1. ✅ Test main app login with existing users
2. ✅ Verify all customer/site data is visible
3. ✅ Create test ticket to ensure CRUD works
4. 🎯 Deploy main app to Azure (optional - eliminates local server)
5. 🎯 Configure custom domain for customer portal

---

**Your main app is now cloud-ready!** No more dynamic IP/firewall issues! 🎉
