# Azure App Service Deployment Guide
## Customer Service Request Portal

This guide explains how to deploy your customer portal to Azure App Service (Windows).

---

## Prerequisites

✅ Azure account with active subscription  
✅ Azure CLI installed ([Download here](https://aka.ms/installazurecliwindows))  
✅ SQL Server accessible from Azure (on-premise or Azure SQL)  
✅ Database user created (use `setup-database-user.sql`)

---

## Quick Deploy (5 Minutes)

### 1. Edit Configuration

Open `deploy-to-azure.ps1` and edit these values at the top:

```powershell
$RESOURCE_GROUP = "YourResourceGroupName"        # Your Azure Resource Group
$APP_NAME = "customer-portal-dcpsp"              # Must be globally unique!
$LOCATION = "eastus"                              # Azure region
$SKU = "F1"                                       # F1 (Free), B1 ($13/mo), S1 ($55/mo)

# Database settings (or edit later in Azure Portal)
$DB_SERVER = "YOUR_SQL_SERVER_IP"                 
$DB_PASSWORD = "CHANGE_THIS_PASSWORD"
```

**Important:** `$APP_NAME` must be globally unique across all Azure!  
Try: `customer-portal-dcpsp`, `dcpsp-service-requests`, `kit-portal`, etc.

### 2. Run Deployment Script

```powershell
cd standalone-customer-portal
.\deploy-to-azure.ps1
```

The script will:
- ✅ Log you into Azure
- ✅ Create Resource Group (if needed)
- ✅ Create App Service Plan (Windows)
- ✅ Create Web App with Node 20 LTS
- ✅ Set environment variables
- ✅ Deploy your application files
- ✅ Restart the app

**Deployment time:** ~2-3 minutes

### 3. Configure Database Access

After deployment, you need to allow Azure to access your SQL Server:

#### Option A: On-Premise SQL Server

1. **Enable TCP/IP:**
   - SQL Server Configuration Manager
   - Protocols → TCP/IP → Enable
   - Set port to 1433

2. **Add Firewall Rule:**
   - Windows Firewall → Inbound Rules
   - Allow TCP port 1433
   - Or allow Azure IPs: [Azure IP Ranges](https://www.microsoft.com/download/details.aspx?id=56519)

3. **Create Database User:**
   - Run `setup-database-user.sql` in SSMS
   - Set strong password

4. **Update App Settings:**
   - Azure Portal → App Services → Your App → Configuration
   - Edit `DB_SERVER` with your public IP
   - Edit `DB_PASSWORD` with actual password
   - Save and restart

#### Option B: Azure SQL Database (Recommended)

1. **Create Azure SQL Database:**
   ```powershell
   az sql server create --name YOUR-SQL-SERVER --resource-group $RESOURCE_GROUP --location $LOCATION --admin-user sqladmin --admin-password YOUR_PASSWORD
   az sql db create --resource-group $RESOURCE_GROUP --server YOUR-SQL-SERVER --name FieldServiceDB --service-objective S0
   ```

2. **Migrate Database:**
   - Export from on-premise: SSMS → Tasks → Export Data-tier Application
   - Import to Azure: SSMS → Connect to Azure SQL → Tasks → Import

3. **Update App Settings:**
   - `DB_SERVER`: `your-server.database.windows.net`
   - `DB_USER`: `portal_user@your-server`

### 4. Add Custom Domain

Point `ssr.dcpsp.com` to your Azure App Service:

1. **In Azure Portal:**
   - App Services → Your App → Custom domains
   - Click "Add custom domain"
   - Enter: `ssr.dcpsp.com`
   - Copy validation records

2. **In Your DNS Provider:**
   - Add CNAME: `ssr` → `customer-portal-dcpsp.azurewebsites.net`
   - Add TXT record for verification (from Azure)
   - Wait 5-10 minutes for DNS propagation

3. **Add SSL Certificate:**
   - Custom domains → Add binding
   - Choose "App Service Managed Certificate" (FREE)
   - Wait ~5 minutes for certificate provisioning

**Your portal will be live at:** `https://ssr.dcpsp.com` 🎉

---

## Verify Deployment

### Test the Portal

Visit: `https://YOUR-APP-NAME.azurewebsites.net`

You should see the service request form.

### Check Logs

If there are issues:

1. **Azure Portal:**
   - App Services → Your App → Log stream
   - Shows real-time application logs

2. **Advanced Tools (Kudu):**
   - App Services → Your App → Advanced Tools → Go
   - Debug console → CMD
   - Navigate to `D:\home\site\wwwroot`
   - Verify files uploaded correctly

### Common Issues

**Error: "Cannot connect to database"**
- ✅ Check `DB_SERVER` is correct (public IP, not localhost)
- ✅ Verify SQL Server allows remote connections
- ✅ Check firewall allows port 1433
- ✅ Verify `DB_USER` and `DB_PASSWORD` are correct

**Error: "App Name already exists"**
- ✅ Change `$APP_NAME` to something unique
- ✅ Try: `dcpsp-portal-2025`, `kit-service-portal`, etc.

**CORS Error in Browser**
- ✅ Check `ALLOWED_ORIGINS` includes your domain
- ✅ Format: `https://ssr.dcpsp.com` (no trailing slash)
- ✅ Restart app after changing

**Form doesn't submit**
- ✅ Check Log stream for errors
- ✅ Verify database connection works
- ✅ Test with browser console open (F12)

---

## Pricing

| Tier | Cost | Features |
|------|------|----------|
| **F1 (Free)** | $0/month | 60 min/day CPU time, 1GB RAM, Good for testing |
| **B1 (Basic)** | ~$13/month | Always on, 1.75GB RAM, Custom domains, SSL |
| **S1 (Standard)** | ~$74/month | Autoscaling, staging slots, backups |

**Recommendation:** Start with **F1 (Free)** for testing, upgrade to **B1** for production.

---

## Update the Portal

To deploy updates later:

```powershell
# Make changes to files in plesk-deployment/
cd standalone-customer-portal

# Redeploy
Compress-Archive -Path plesk-deployment\* -DestinationPath azure-deploy.zip -Force
az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $APP_NAME --src azure-deploy.zip
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_NAME
```

Or use the full script again - it will update existing app.

---

## Monitoring

### View Usage

Azure Portal → App Services → Your App → Metrics

Track:
- HTTP requests
- Response times
- Error rates
- CPU/Memory usage

### Set Alerts

Azure Portal → App Services → Your App → Alerts

Create alerts for:
- HTTP 5xx errors
- High response time
- CPU > 80%

---

## Security Checklist

Before going live:

- [ ] `ALLOWED_ORIGINS` restricted to your domain (not `*`)
- [ ] `DB_PASSWORD` is strong (not default)
- [ ] Database user has minimal permissions (INSERT only)
- [ ] SQL Server firewall restricted to Azure IPs
- [ ] SSL certificate enabled (https://)
- [ ] Tested from external network
- [ ] Logs show no errors

---

## Need Help?

**View Logs:**
```powershell
az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME
```

**Restart App:**
```powershell
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_NAME
```

**View Configuration:**
```powershell
az webapp config appsettings list --resource-group $RESOURCE_GROUP --name $APP_NAME
```

**SSH into App:**
- Azure Portal → App Services → Your App → SSH
- Browse filesystem, check logs, debug

---

## Support

For Azure-specific issues, see:
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Node.js on Azure](https://docs.microsoft.com/azure/app-service/quickstart-nodejs)
- [Troubleshooting Guide](https://docs.microsoft.com/azure/app-service/troubleshoot-diagnostic-logs)

---

**Ready to deploy?** Just run `.\deploy-to-azure.ps1` and follow the prompts! 🚀
