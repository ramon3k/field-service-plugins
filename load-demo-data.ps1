# ================================================================
# Load Comprehensive Demo Data to Azure SQL
# ================================================================

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  📊 Loading Comprehensive Demo Data to Azure SQL" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Create demo users across 8 states"
Write-Host "  2. Create demo customers nationwide"
Write-Host "  3. Create demo sites with geolocations"
Write-Host "  4. Create demo licenses for each site"
Write-Host "  5. Create 35+ demo tickets in various statuses"
Write-Host "  6. Add activity logs and notes"
Write-Host ""
Write-Host "⚠️  WARNING: This will delete existing DEMO-* data!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host "`n🔌 Getting Azure SQL credentials..." -ForegroundColor Cyan

# Get connection string from Azure
$connString = az webapp config connection-string list `
    --name field-service-api `
    --resource-group customer-portal_group `
    --query "[0].value" -o tsv

if (-not $connString) {
    Write-Host "❌ Could not retrieve connection string from Azure" -ForegroundColor Red
    Write-Host "Trying environment variables..." -ForegroundColor Yellow
    
    if (-not $env:DB_USER -or -not $env:DB_PASSWORD) {
        Write-Host "❌ No credentials found!" -ForegroundColor Red
        Write-Host "Please set DB_USER and DB_PASSWORD environment variables" -ForegroundColor Yellow
        Write-Host "Or run: az login" -ForegroundColor Yellow
        exit 1
    }
    
    $server = "customer-portal-sql-server.database.windows.net"
    $database = "FieldServiceDB"
    $user = $env:DB_USER
    $password = $env:DB_PASSWORD
} else {
    # Parse connection string
    if ($connString -match "Server=([^;]+)") { $server = $matches[1] }
    if ($connString -match "Database=([^;]+)") { $database = $matches[1] }
    if ($connString -match "User ID=([^;]+)") { $user = $matches[1] }
    if ($connString -match "Password=([^;]+)") { $password = $matches[1] }
}

Write-Host "✅ Credentials obtained" -ForegroundColor Green
Write-Host "   Server: $server" -ForegroundColor Gray
Write-Host "   Database: $database" -ForegroundColor Gray
Write-Host "   User: $user" -ForegroundColor Gray

# Check if sqlcmd is available
$sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmd) {
    Write-Host "`n⚠️  sqlcmd not found. Installing SQL Server command-line tools..." -ForegroundColor Yellow
    Write-Host "Download from: https://learn.microsoft.com/en-us/sql/tools/sqlcmd-utility" -ForegroundColor Yellow
    Write-Host "`nAlternatively, use Azure Data Studio or SSMS to run:" -ForegroundColor Yellow
    Write-Host "  1. database\create-comprehensive-demo-data.sql" -ForegroundColor Cyan
    Write-Host "  2. database\create-demo-tickets.sql" -ForegroundColor Cyan
    exit 1
}

# Load demo data
Write-Host "`n📥 Step 1: Creating demo users, customers, sites, and licenses..." -ForegroundColor Cyan

sqlcmd -S $server -d $database -U $user -P $password `
    -i "database\create-comprehensive-demo-data.sql" `
    -o "demo-data-load.log" `
    -e

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error loading demo data!" -ForegroundColor Red
    Write-Host "Check demo-data-load.log for details" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Demo base data loaded" -ForegroundColor Green

Write-Host "`n📥 Step 2: Creating demo tickets with activity logs..." -ForegroundColor Cyan

sqlcmd -S $server -d $database -U $user -P $password `
    -i "database\create-demo-tickets.sql" `
    -o "demo-tickets-load.log" `
    -e

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error loading demo tickets!" -ForegroundColor Red
    Write-Host "Check demo-tickets-load.log for details" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Demo tickets loaded" -ForegroundColor Green

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  ✅ Demo Data Loaded Successfully!" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Green

Write-Host "📊 What was created:" -ForegroundColor Cyan
Write-Host "   • 14 Demo Users (technicians in CA, TX, NY, FL, IL, WA, CO, GA)" -ForegroundColor White
Write-Host "   • 18 Demo Customers (nationwide coverage)" -ForegroundColor White
Write-Host "   • 27 Demo Sites (with real geocoordinates)" -ForegroundColor White
Write-Host "   • 22 Demo Licenses (security systems)" -ForegroundColor White
Write-Host "   • 35 Demo Tickets (various statuses and priorities)" -ForegroundColor White
Write-Host "   • Activity logs for in-progress tickets" -ForegroundColor White
Write-Host "   • Notes with customer context" -ForegroundColor White

Write-Host "`n🎯 Ready to test!" -ForegroundColor Green
Write-Host "`nTo access demo data:" -ForegroundColor Cyan
Write-Host "   • Login with: demo-admin / demo123" -ForegroundColor White
Write-Host "   • Or any demo-tech-XX user / demo123" -ForegroundColor White
Write-Host "   • Company Code: DEMO or KIT" -ForegroundColor White

Write-Host "`nAll demo data is prefixed with DEMO- for easy identification." -ForegroundColor Gray

Write-Host "`n✅ Logs saved to:" -ForegroundColor Cyan
Write-Host "   • demo-data-load.log" -ForegroundColor White
Write-Host "   • demo-tickets-load.log" -ForegroundColor White
Write-Host ""
