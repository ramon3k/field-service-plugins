# Azure Deployment Guide - Field Service Multi-Tenant

## 🚀 Full Azure Deployment (Recommended)

This guide walks you through deploying your Field Service application to Azure with a single multi-tenant database.

### Prerequisites

1. **Azure CLI** installed
   - Download: https://aka.ms/installazurecliwindows
   - Verify: `az --version`

2. **Azure Subscription**
   - Sign up: https://azure.microsoft.com/free/
   - You get $200 free credit for 30 days

3. **SQL Server Management Studio (SSMS)** or **Azure Data Studio**
   - For database migration

### Cost Estimate

| Resource | SKU | Monthly Cost |
|----------|-----|--------------|
| Azure SQL Database | S0 (10 DTU) | ~$15 |
| App Service | B1 (Basic) | ~$13 |
| **Total** | | **~$28/month** |

💡 You can start with these and scale up as needed.

---

## Option 1: Automated Deployment (Easiest)

### Step 1: Run the Deployment Script

```batch
deploy-azure-full.bat
```

This script will:
1. ✅ Create Azure SQL Server and Database
2. ✅ Configure firewall rules
3. ✅ Create App Service
4. ✅ Build and deploy your application
5. ✅ Configure environment variables

### Step 2: Migrate Database

The script will pause for you to set up the database. Choose one method:

#### Method A: Using SSMS (Recommended)

1. Open SQL Server Management Studio
2. Connect to local: `localhost\SQLEXPRESS`
3. Right-click `FieldServiceDB` > **Tasks** > **Export Data-tier Application**
4. Save as `.bacpac` file
5. Connect to Azure SQL (connection info from script)
6. Right-click **Databases** > **Import Data-tier Application**
7. Select your `.bacpac` file

#### Method B: Using sqlcmd

```batch
# Export from local
sqlcmd -S localhost\SQLEXPRESS -E -d FieldServiceDB -Q "BACKUP DATABASE FieldServiceDB TO DISK='C:\Temp\FieldServiceDB.bak'"

# Use Azure SQL Migration Extension in Azure Data Studio
# or upload and restore via Azure Portal
```

#### Method C: Script-Based Migration

```batch
# 1. Generate scripts from local database
sqlcmd -S localhost\SQLEXPRESS -E -d FieldServiceDB -i "database\create-database.sql" -o "azure-schema.sql"

# 2. Connect to Azure and run
sqlcmd -S your-server.database.windows.net -U fsadmin -P YourPassword -d FieldServiceDB -i "azure-schema.sql"

# 3. Verify
sqlcmd -S your-server.database.windows.net -U fsadmin -P YourPassword -d FieldServiceDB -i "database\export-for-azure.sql"
```

### Step 3: Test the Deployment

1. Open the URL from the script: `https://field-service-app-xxxxx.azurewebsites.net`
2. Login with DCPSP credentials
3. Verify tickets and data load
4. Logout and login with JBI credentials
5. Verify data isolation (should only see JBI data)

---

## Option 2: Manual Deployment

### 1. Create Azure Resources

```bash
# Login
az login

# Create resource group
az group create --name field-service-rg --location eastus

# Create SQL Server
az sql server create \
    --name field-service-sql-12345 \
    --resource-group field-service-rg \
    --location eastus \
    --admin-user fsadmin \
    --admin-password 'YourStrongPassword123!'

# Create SQL Database
az sql db create \
    --resource-group field-service-rg \
    --server field-service-sql-12345 \
    --name FieldServiceDB \
    --service-objective S0

# Add firewall rule for your IP
az sql server firewall-rule create \
    --resource-group field-service-rg \
    --server field-service-sql-12345 \
    --name AllowMyIP \
    --start-ip-address YOUR_IP \
    --end-ip-address YOUR_IP

# Allow Azure services
az sql server firewall-rule create \
    --resource-group field-service-rg \
    --server field-service-sql-12345 \
    --name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0
```

### 2. Create App Service

```bash
# Create App Service Plan
az appservice plan create \
    --name field-service-plan \
    --resource-group field-service-rg \
    --sku B1 \
    --is-linux

# Create Web App
az webapp create \
    --resource-group field-service-rg \
    --plan field-service-plan \
    --name field-service-app-12345 \
    --runtime "NODE:18-lts"

# Configure app settings
az webapp config appsettings set \
    --resource-group field-service-rg \
    --name field-service-app-12345 \
    --settings \
    NODE_ENV=production \
    PORT=8080 \
    JWT_SECRET="your-random-secret-key" \
    DB_SERVER="field-service-sql-12345.database.windows.net" \
    DB_NAME="FieldServiceDB" \
    DB_USER="fsadmin" \
    DB_PASSWORD="YourStrongPassword123!" \
    DB_ENCRYPT="true"
```

### 3. Build and Deploy

```bash
# Build frontend
npm run build

# Create deployment package
mkdir deploy-package
cp -r server/* deploy-package/
cp -r dist/* deploy-package/public/
cp package*.json deploy-package/

# Install dependencies
cd deploy-package
npm ci --omit=dev
cd ..

# Create zip
Compress-Archive -Path deploy-package\* -DestinationPath deployment.zip -Force

# Deploy
az webapp deployment source config-zip \
    --resource-group field-service-rg \
    --name field-service-app-12345 \
    --src deployment.zip
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection from Azure App Service
az webapp log tail --resource-group field-service-rg --name field-service-app-12345

# Check if IP is allowed
az sql server firewall-rule list --resource-group field-service-rg --server field-service-sql-12345
```

### App Not Starting

```bash
# Check logs
az webapp log tail --resource-group field-service-rg --name field-service-app-12345

# Restart app
az webapp restart --resource-group field-service-rg --name field-service-app-12345
```

### Login Issues

1. Check if database has Companies table
2. Verify admin users exist
3. Check JWT_SECRET is set
4. Verify DB connection string

---

## Post-Deployment

### 1. Set Up Custom Domain (Optional)

```bash
az webapp config hostname add \
    --resource-group field-service-rg \
    --webapp-name field-service-app-12345 \
    --hostname yourdomain.com
```

### 2. Enable Application Insights

```bash
az monitor app-insights component create \
    --app field-service-insights \
    --location eastus \
    --resource-group field-service-rg

# Link to web app
az webapp config appsettings set \
    --resource-group field-service-rg \
    --name field-service-app-12345 \
    --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-key"
```

### 3. Set Up Automated Backups

```bash
# SQL Database automatic backups are enabled by default
# Retention: 7 days for Basic, 35 days for Standard

# Configure backup policy if needed
az sql db ltr-policy set \
    --resource-group field-service-rg \
    --server field-service-sql-12345 \
    --database FieldServiceDB \
    --weekly-retention P4W \
    --monthly-retention P12M
```

### 4. Enable Scaling (Optional)

```bash
# Auto-scale App Service
az monitor autoscale create \
    --resource-group field-service-rg \
    --resource field-service-plan \
    --resource-type Microsoft.Web/serverfarms \
    --name field-service-autoscale \
    --min-count 1 \
    --max-count 3 \
    --count 1

# Scale SQL Database
az sql db update \
    --resource-group field-service-rg \
    --server field-service-sql-12345 \
    --name FieldServiceDB \
    --service-objective S1  # Upgrade from S0
```

---

## Cleanup (Delete Everything)

```bash
# Delete entire resource group
az group delete --name field-service-rg --yes --no-wait
```

---

## Quick Reference

### Connection Strings

**Azure SQL:**
```
Server=tcp:field-service-sql-12345.database.windows.net,1433;Initial Catalog=FieldServiceDB;User ID=fsadmin;Password=YourPassword;Encrypt=true;TrustServerCertificate=false;
```

**App URL:**
```
https://field-service-app-12345.azurewebsites.net
```

### Useful Commands

```bash
# View all resources
az resource list --resource-group field-service-rg --output table

# Check app status
az webapp show --resource-group field-service-rg --name field-service-app-12345 --query state

# View database size
az sql db show --resource-group field-service-rg --server field-service-sql-12345 --name FieldServiceDB --query currentSizeBytes

# Check costs
az consumption usage list --resource-group field-service-rg
```

---

## Support

- Azure Documentation: https://docs.microsoft.com/azure
- Azure Support: https://azure.microsoft.com/support
- Pricing Calculator: https://azure.microsoft.com/pricing/calculator/

---

**Ready to deploy?** Run `deploy-azure-full.bat` to get started!
