# How to Run the Vendor Compliance Database Migration

## Prerequisites
- Access to Azure SQL Database
- Azure Data Studio or SQL Server Management Studio installed
- Connection to: `FieldServiceManagement` database

## Step-by-Step Instructions

### Option 1: Using Azure Data Studio (Recommended)

1. **Open Azure Data Studio**

2. **Connect to your Azure SQL Database**:
   - Click "New Connection"
   - Server: Your Azure SQL server name (e.g., `yourserver.database.windows.net`)
   - Authentication: SQL Login or Azure Active Directory
   - Database: `FieldServiceManagement`
   - Click "Connect"

3. **Open the Migration Script**:
   - File → Open File
   - Navigate to: `database/add-vendor-compliance-fields.sql`
   - Or copy the script contents from the file

4. **Run the Script**:
   - Click the "Run" button (or press F5)
   - Watch the Messages panel for confirmation

5. **Expected Output**:
   ```
   Added StateLicenseNumber column to Licenses table
   Added StateLicenseExpiration column to Licenses table
   Added COIExpiration column to Licenses table
   Added COIProvider column to Licenses table
   
   ✅ Vendor compliance tracking fields added successfully!
   ```

### Option 2: Using SQL Server Management Studio (SSMS)

1. **Open SSMS**

2. **Connect to Azure SQL**:
   - Server name: Your Azure SQL server
   - Authentication: SQL Server Authentication or Azure Active Directory
   - Login with your credentials

3. **Select Database**:
   - In Object Explorer, expand Databases
   - Right-click `FieldServiceManagement` → New Query

4. **Paste and Run Script**:
   - Open `database/add-vendor-compliance-fields.sql`
   - Copy all contents
   - Paste into the query window
   - Click "Execute" (or press F5)

5. **Verify Success**:
   - Check Messages tab for success messages
   - The script will show which columns were added

### Option 3: Azure Portal Query Editor

1. **Go to Azure Portal** (portal.azure.com)

2. **Navigate to your SQL Database**:
   - Search for "SQL databases"
   - Select `FieldServiceManagement`

3. **Open Query Editor**:
   - Click "Query editor (preview)" in the left menu
   - Login with your SQL credentials

4. **Run the Script**:
   - Copy contents of `database/add-vendor-compliance-fields.sql`
   - Paste into the query editor
   - Click "Run"

5. **Check Results**:
   - Results panel will show success messages

## Verification

After running the script, verify the columns were added:

```sql
-- Run this query to check:
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Licenses'
    AND COLUMN_NAME IN ('StateLicenseNumber', 'StateLicenseExpiration', 'COIExpiration', 'COIProvider')
ORDER BY ORDINAL_POSITION;
```

**Expected result:** 4 rows showing the new columns

## Troubleshooting

### "Column already exists" error
- This is OK! The script is designed to be safe to run multiple times
- It checks if columns exist before adding them

### Connection errors
- Verify your Azure SQL firewall allows your IP address
- Azure Portal → SQL Server → Firewalls and virtual networks
- Add your client IP if needed

### Permission errors
- You need `ALTER` permission on the `Licenses` table
- Contact your database administrator if you don't have permissions

## What Gets Added

The migration adds these 4 columns to the `Licenses` table:

| Column Name | Data Type | Nullable | Purpose |
|-------------|-----------|----------|---------|
| StateLicenseNumber | NVARCHAR(100) | YES | Vendor's state license number |
| StateLicenseExpiration | DATE | YES | When vendor's state license expires |
| COIExpiration | DATE | YES | Certificate of Insurance expiration |
| COIProvider | NVARCHAR(200) | YES | Insurance provider name |

## After Migration

Once the migration is complete:
1. Existing licenses will have NULL values for these fields
2. You can start entering vendor compliance data in the license edit modal
3. The fields are all optional - you don't have to fill them for every license

---

**Need Help?**
- Check the script output messages
- Review the VENDOR-COMPLIANCE-FEATURE.md file for more details
- All changes are additive - no existing data is modified
