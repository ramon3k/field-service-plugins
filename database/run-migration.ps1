# Run Vendor Compliance Database Migration
# This script adds the vendor compliance tracking fields to the Licenses table

$Server = "customer-portal-sql-server.database.windows.net"
$Database = "FieldServiceDB"
$Username = "sqladmin"
$Password = "CustomerPortal2025!"
$ScriptPath = ".\database\add-vendor-compliance-fields.sql"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Vendor Compliance Migration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server:   $Server" -ForegroundColor Yellow
Write-Host "Database: $Database" -ForegroundColor Yellow
Write-Host "Script:   $ScriptPath" -ForegroundColor Yellow
Write-Host ""

# Check if script file exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ Error: Script file not found: $ScriptPath" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "Running migration script..." -ForegroundColor Green
Write-Host ""

# Run the SQL script using sqlcmd
sqlcmd -S $Server -d $Database -U $Username -P $Password -i $ScriptPath -I

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://fsm.dcpsp.com/licenses" -ForegroundColor White
    Write-Host "2. Edit any license" -ForegroundColor White
    Write-Host "3. Scroll to 'Vendor Compliance Tracking' section" -ForegroundColor White
    Write-Host "4. Enter vendor state license and COI information" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    exit 1
}
