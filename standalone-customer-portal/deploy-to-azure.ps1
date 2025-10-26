# ====================================================================
# Azure App Service Deployment Script
# Customer Service Request Portal
# ====================================================================

# CONFIGURATION - EDIT THESE VALUES
$RESOURCE_GROUP = "YourResourceGroupName"        # Your Azure Resource Group
$APP_NAME = "customer-portal-dcpsp"              # App Service name (must be globally unique)
$LOCATION = "eastus"                              # Azure region (eastus, westus2, etc.)
$SKU = "F1"                                       # Pricing tier: F1 (Free), B1 (Basic $13/mo), S1 (Standard)

# Database Configuration (edit these in Azure Portal after deployment)
$DB_SERVER = "YOUR_SQL_SERVER_IP"                 # Your SQL Server IP or hostname
$DB_NAME = "FieldServiceDB"
$DB_USER = "portal_user"
$DB_PASSWORD = "CHANGE_THIS_PASSWORD"             # Use a strong password!
$COMPANY_CODE = "KIT"
$ALLOWED_ORIGINS = "https://ssr.dcpsp.com,https://$APP_NAME.azurewebsites.net"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "Azure App Service Deployment - Customer Portal" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to Azure
Write-Host "Step 1: Logging into Azure..." -ForegroundColor Yellow
az login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Azure login failed. Please try again." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged in successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Create Resource Group (if it doesn't exist)
Write-Host "Step 2: Checking Resource Group..." -ForegroundColor Yellow
$rgExists = az group exists --name $RESOURCE_GROUP
if ($rgExists -eq "false") {
    Write-Host "Creating Resource Group: $RESOURCE_GROUP" -ForegroundColor Yellow
    az group create --name $RESOURCE_GROUP --location $LOCATION
    Write-Host "✅ Resource Group created" -ForegroundColor Green
} else {
    Write-Host "✅ Resource Group exists" -ForegroundColor Green
}
Write-Host ""

# Step 3: Create App Service Plan (Windows)
Write-Host "Step 3: Creating App Service Plan..." -ForegroundColor Yellow
$planName = "$APP_NAME-plan"
az appservice plan create `
    --name $planName `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION `
    --sku $SKU `
    --is-windows

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  App Service Plan might already exist, continuing..." -ForegroundColor Yellow
}
Write-Host "✅ App Service Plan ready" -ForegroundColor Green
Write-Host ""

# Step 4: Create Web App (Windows with Node 20 LTS)
Write-Host "Step 4: Creating Web App..." -ForegroundColor Yellow
az webapp create `
    --name $APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --plan $planName `
    --runtime "NODE:20LTS"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Web App. It might already exist or name is taken." -ForegroundColor Red
    Write-Host "   Try a different APP_NAME at the top of this script." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Web App created: https://$APP_NAME.azurewebsites.net" -ForegroundColor Green
Write-Host ""

# Step 5: Configure Application Settings (Environment Variables)
Write-Host "Step 5: Configuring Application Settings..." -ForegroundColor Yellow
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --settings `
        DB_SERVER="$DB_SERVER" `
        DB_NAME="$DB_NAME" `
        DB_USER="$DB_USER" `
        DB_PASSWORD="$DB_PASSWORD" `
        COMPANY_CODE="$COMPANY_CODE" `
        ALLOWED_ORIGINS="$ALLOWED_ORIGINS" `
        NODE_ENV="production" `
        WEBSITE_NODE_DEFAULT_VERSION="20-lts"

Write-Host "✅ Application settings configured" -ForegroundColor Green
Write-Host ""

# Step 6: Deploy Application Files
Write-Host "Step 6: Deploying application files..." -ForegroundColor Yellow
Write-Host "Creating deployment ZIP..." -ForegroundColor Yellow

# Create ZIP from plesk-deployment folder
$deployPath = "plesk-deployment"
$zipPath = "azure-deploy.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$deployPath\*" -DestinationPath $zipPath -Force

Write-Host "Uploading to Azure..." -ForegroundColor Yellow
az webapp deployment source config-zip `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --src $zipPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed. Check the error above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Application deployed successfully" -ForegroundColor Green
Write-Host ""

# Step 7: Restart the Web App
Write-Host "Step 7: Restarting Web App..." -ForegroundColor Yellow
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_NAME
Write-Host "✅ Web App restarted" -ForegroundColor Green
Write-Host ""

# Cleanup
Remove-Item $zipPath -Force

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your portal is live at: https://$APP_NAME.azurewebsites.net" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. ⚠️  Update DB_SERVER, DB_PASSWORD in Azure Portal Configuration" -ForegroundColor Yellow
Write-Host "   Go to: Portal → App Services → $APP_NAME → Configuration" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🔒 Enable SQL Server Remote Access:" -ForegroundColor Yellow
Write-Host "   - Enable TCP/IP on port 1433" -ForegroundColor Gray
Write-Host "   - Add firewall rule for Azure IPs" -ForegroundColor Gray
Write-Host "   - Run setup-database-user.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 🌐 Add Custom Domain (ssr.dcpsp.com):" -ForegroundColor Yellow
Write-Host "   Portal → Custom domains → Add custom domain" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 🧪 Test the portal:" -ForegroundColor Yellow
Write-Host "   https://$APP_NAME.azurewebsites.net" -ForegroundColor Gray
Write-Host ""
Write-Host "5. 📊 View Logs (if issues):" -ForegroundColor Yellow
Write-Host "   Portal → Log stream" -ForegroundColor Gray
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
