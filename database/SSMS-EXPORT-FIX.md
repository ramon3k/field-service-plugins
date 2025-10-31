# SSMS Export Fix - Azure SQL Compatible Export

## The Problem
SSMS exported SQL Server Express-specific settings that Azure SQL doesn't support (AUTO_CLOSE, database mirroring, etc.)

## The Solution - Export Data Only

### In SSMS - Correct Export Settings:

1. **Connect to local SQL Express:**
   - Server: `localhost\SQLEXPRESS`
   - Auth: Windows Authentication

2. **Right-click FieldServiceDB → Tasks → Generate Scripts**

3. **Choose Objects:**
   - Select specific tables:
     ☑ dbo.Users
     ☑ dbo.Customers
     ☑ dbo.Sites
     ☑ dbo.Assets
     ☑ dbo.Vendors
     ☑ dbo.Licenses
     ☑ dbo.Tickets
     ☑ dbo.CoordinatorNotes (if exists)
     ☑ dbo.AuditTrail (if exists)
   - Click Next

4. **⚠️ CRITICAL - Advanced Settings:**
   Click "Advanced" and change these:
   
   **DO NOT SCRIPT:**
   - Script Database Create: **FALSE** (Azure DB already exists!)
   - Script for Server Version: **SQL Azure Database** (NOT SQL Server 2019!)
   - Script USE DATABASE: **FALSE** (causes errors in Azure)
   - Script Collation: **FALSE**
   - Script Extended Properties: **FALSE**
   
   **DO SCRIPT:**
   - Types of data to script: **Data only** (schema already exists!)
   - Script Indexes: **FALSE** (already created)
   - Script Primary Keys: **FALSE** (already created)
   - Script Foreign Keys: **FALSE** (already created)
   - Script for Dependency: **FALSE**
   
   **Important Settings:**
   - Check for Object Existence: **TRUE** (safe mode)
   - Schema Qualify Object Names: **TRUE**
   - Table/View Options - Script Indexes: **FALSE**

5. **Output:**
   - Save to file: `C:\Temp\FieldServiceDB-DataOnly.sql`
   - Click Next → Finish

## Result
You'll get a clean INSERT-only script that Azure SQL can handle!

---

## Alternative: PowerShell Data Export (If SSMS is too complex)

Run this in PowerShell to export just the data:

```powershell
# Run this in your workspace
cd database
.\export-data-only.ps1
```

This creates clean INSERT statements without any database settings.

---

## After Export - Before Import

**Clean the exported file** (if it still has errors):

1. Open `FieldServiceDB-DataOnly.sql` in VS Code
2. Remove any lines that start with:
   - `ALTER DATABASE`
   - `USE [FieldServiceDB]`
   - `SET ANSI_NULLS`
   - `SET QUOTED_IDENTIFIER`
   - `CREATE TABLE` (tables already exist!)
   
3. Keep only:
   - `SET IDENTITY_INSERT TableName ON`
   - `INSERT` statements
   - `SET IDENTITY_INSERT TableName OFF`

---

## Import to Azure SQL

1. Connect SSMS to Azure:
   - Server: `customer-portal-sql-server.database.windows.net`
   - Auth: SQL Server Authentication
   - Login: `sqladmin`
   - Password: `CustomerPortal2025!`

2. Make sure you're connected to **FieldServiceDB** database

3. Open the cleaned script: `FieldServiceDB-DataOnly.sql`

4. Execute (F5)

5. Check for errors - should now work cleanly!

---

## Verify After Import

Run in Azure Query Editor:

```sql
-- Count records
SELECT 'Users' as [Table], COUNT(*) as Records FROM Users
UNION ALL
SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL
SELECT 'Sites', COUNT(*) FROM Sites
UNION ALL  
SELECT 'Tickets', COUNT(*) FROM Tickets;

-- Check a user exists
SELECT TOP 5 Username, Email, Role FROM Users;
```

If you see your data, you're done! 🎉
