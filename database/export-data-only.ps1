# Export Data Only from Local SQL Express to Azure-Compatible SQL Script
# This creates pure INSERT statements without database configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Data Export for Azure SQL Migration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$exportPath = "C:\Temp\FieldServiceDB-DataOnly.sql"

# Ensure directory exists
$exportDir = Split-Path $exportPath
if (!(Test-Path $exportDir)) {
    New-Item -ItemType Directory -Path $exportDir -Force | Out-Null
}

Write-Host "Export path: $exportPath`n" -ForegroundColor Gray

# Local SQL Express connection
$serverInstance = "localhost\SQLEXPRESS"
$database = "FieldServiceDB"

# Tables to export in order (respects foreign keys)
$tables = @(
    'Users',
    'Customers',
    'Sites',
    'Assets',
    'Vendors',
    'Licenses',
    'Tickets',
    'CoordinatorNotes',
    'AuditTrail'
)

# Start building export file
$exportContent = @"
-- ========================================
-- FieldServiceDB Data Export (Azure SQL Compatible)
-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- ========================================
-- This script contains ONLY INSERT statements
-- Schema (tables/indexes) already exists in Azure
-- ========================================

"@

Write-Host "[1/3] Connecting to local SQL Express..." -ForegroundColor Yellow

try {
    $connection = New-Object System.Data.SqlClient.SqlConnection
    $connection.ConnectionString = "Server=$serverInstance;Database=$database;Integrated Security=True;TrustServerCertificate=True"
    $connection.Open()
    Write-Host "✅ Connected successfully`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to connect: $_" -ForegroundColor Red
    Write-Host "`nMake sure SQL Server Express is running." -ForegroundColor Yellow
    exit 1
}

Write-Host "[2/3] Exporting table data...`n" -ForegroundColor Yellow

foreach ($table in $tables) {
    Write-Host "  Processing: $table" -ForegroundColor Cyan
    
    # Check if table exists
    $checkCmd = $connection.CreateCommand()
    $checkCmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '$table'"
    $tableExists = $checkCmd.ExecuteScalar()
    
    if ($tableExists -eq 0) {
        Write-Host "    ⚠ Table not found, skipping" -ForegroundColor Yellow
        continue
    }
    
    # Get row count
    $countCmd = $connection.CreateCommand()
    $countCmd.CommandText = "SELECT COUNT(*) FROM [$table]"
    $rowCount = $countCmd.ExecuteScalar()
    
    if ($rowCount -eq 0) {
        Write-Host "    → 0 rows (empty)" -ForegroundColor Gray
        continue
    }
    
    Write-Host "    → $rowCount rows" -ForegroundColor Gray
    
    # Add table header to export
    $exportContent += "`n-- ========================================`n"
    $exportContent += "-- Table: $table ($rowCount rows)`n"
    $exportContent += "-- ========================================`n"
    $exportContent += "PRINT 'Importing $table...';`n"
    $exportContent += "SET IDENTITY_INSERT [$table] ON;`n`n"
    
    # Get data
    $dataCmd = $connection.CreateCommand()
    $dataCmd.CommandText = "SELECT * FROM [$table]"
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($dataCmd)
    $dataTable = New-Object System.Data.DataTable
    [void]$adapter.Fill($dataTable)
    
    # Generate INSERT statements
    $insertCount = 0
    foreach ($row in $dataTable.Rows) {
        $columns = @()
        $values = @()
        
        foreach ($column in $dataTable.Columns) {
            $columnName = $column.ColumnName
            $value = $row[$columnName]
            
            $columns += "[$columnName]"
            
            if ($value -is [DBNull] -or $null -eq $value) {
                $values += "NULL"
            }
            elseif ($value -is [DateTime]) {
                $values += "'" + $value.ToString("yyyy-MM-dd HH:mm:ss.fff") + "'"
            }
            elseif ($value -is [bool]) {
                $values += if ($value) { "1" } else { "0" }
            }
            elseif ($value -is [string]) {
                # Escape single quotes
                $escapedValue = $value.Replace("'", "''")
                $values += "N'" + $escapedValue + "'"
            }
            elseif ($value -is [byte[]]) {
                # Binary data
                $hexString = [BitConverter]::ToString($value).Replace("-", "")
                $values += "0x$hexString"
            }
            else {
                $values += $value
            }
        }
        
        $insertStatement = "INSERT INTO [$table] ($($columns -join ', ')) VALUES ($($values -join ', '));`n"
        $exportContent += $insertStatement
        $insertCount++
        
        # Add batch separator every 1000 rows for performance
        if ($insertCount % 1000 -eq 0) {
            $exportContent += "GO`n"
        }
    }
    
    $exportContent += "`nSET IDENTITY_INSERT [$table] OFF;`n"
    $exportContent += "PRINT '  ✅ Imported $insertCount rows into $table';`n"
}

Write-Host "`n[3/3] Saving export file..." -ForegroundColor Yellow

$exportContent += "`n-- ========================================`n"
$exportContent += "PRINT 'Migration complete!';`n"
$exportContent += "-- ========================================`n"

try {
    $exportContent | Out-File -FilePath $exportPath -Encoding UTF8 -Force
    Write-Host "✅ Export saved: $exportPath`n" -ForegroundColor Green
    
    $fileSize = (Get-Item $exportPath).Length / 1KB
    Write-Host "File size: $([math]::Round($fileSize, 2)) KB`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to save file: $_" -ForegroundColor Red
    exit 1
}

$connection.Close()

Write-Host "========================================" -ForegroundColor Green
Write-Host "Export Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open SSMS and connect to Azure SQL:" -ForegroundColor White
Write-Host "   Server: customer-portal-sql-server.database.windows.net" -ForegroundColor Gray
Write-Host "   Login: sqladmin / CustomerPortal2025!" -ForegroundColor Gray
Write-Host "`n2. Select database: FieldServiceDB" -ForegroundColor White
Write-Host "`n3. Open file: $exportPath" -ForegroundColor White
Write-Host "`n4. Execute (F5)" -ForegroundColor White
Write-Host "`n5. Check for errors in Messages tab`n" -ForegroundColor White
