# Azure SQL Database Setup Script
# This creates a cost-effective Azure SQL Database for your customer portal

$RESOURCE_GROUP = "customer-portal_group"
$SQL_SERVER_NAME = "dcpsp-sql-server"  # Must be globally unique
$SQL_DB_NAME = "FieldServiceDB"
$ADMIN_USER = "sqladmin"
$ADMIN_PASSWORD = "YourStrongPassword123!"  # Change this!
$LOCATION = "centralus"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "Azure SQL Database Setup" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Login to Azure
Write-Host "Step 1: Logging into Azure..." -ForegroundColor Yellow
az login

# Create SQL Server
Write-Host ""
Write-Host "Step 2: Creating Azure SQL Server..." -ForegroundColor Yellow
az sql server create `
    --name $SQL_SERVER_NAME `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION `
    --admin-user $ADMIN_USER `
    --admin-password $ADMIN_PASSWORD

# Allow Azure services to access
Write-Host ""
Write-Host "Step 3: Configuring firewall..." -ForegroundColor Yellow
az sql server firewall-rule create `
    --resource-group $RESOURCE_GROUP `
    --server $SQL_SERVER_NAME `
    --name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0

# Create database (Basic tier - cheapest)
Write-Host ""
Write-Host "Step 4: Creating database..." -ForegroundColor Yellow
az sql db create `
    --resource-group $RESOURCE_GROUP `
    --server $SQL_SERVER_NAME `
    --name $SQL_DB_NAME `
    --service-objective Basic `
    --backup-storage-redundancy Local

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "✅ Azure SQL Database Created!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection String:" -ForegroundColor Yellow
Write-Host "Server: $SQL_SERVER_NAME.database.windows.net" -ForegroundColor White
Write-Host "Database: $SQL_DB_NAME" -ForegroundColor White
Write-Host "Username: $ADMIN_USER" -ForegroundColor White
Write-Host "Password: $ADMIN_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Export your local database:" -ForegroundColor White
Write-Host "   SSMS → Right-click FieldServiceDB → Tasks → Export Data-tier Application" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Import to Azure SQL:" -ForegroundColor White
Write-Host "   SSMS → Connect to $SQL_SERVER_NAME.database.windows.net" -ForegroundColor Gray
Write-Host "   Right-click → Import Data-tier Application" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Update Azure App Service settings:" -ForegroundColor White
Write-Host "   DB_SERVER = $SQL_SERVER_NAME.database.windows.net" -ForegroundColor Gray
Write-Host "   DB_USER = portal_user" -ForegroundColor Gray
Write-Host ""
Write-Host "Monthly Cost: ~\$5 (Basic tier)" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
