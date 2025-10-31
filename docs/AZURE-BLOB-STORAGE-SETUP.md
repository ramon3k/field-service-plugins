# Azure Blob Storage Setup Guide

## Overview

When deploying to Azure App Service, **local file storage is ephemeral** - uploaded files will be deleted when the app restarts or redeploys. For production deployments, configure Azure Blob Storage for persistent file storage.

## Why Azure Blob Storage?

| Feature | Local Storage | Azure Blob Storage |
|---------|---------------|-------------------|
| **Persistence** | ❌ Lost on restart | ✅ Permanent |
| **Scalability** | ❌ Limited | ✅ Unlimited |
| **Cost** | Free | ~$0.02/GB/month |
| **Multi-instance** | ❌ Not shared | ✅ Shared across all instances |
| **CDN Support** | ❌ No | ✅ Yes |
| **Backup** | Manual | Automatic (geo-redundant) |

## Quick Setup

### 1. Create Azure Storage Account

#### Option A: Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → **Storage account**
3. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Same as your App Service
   - **Storage account name**: `fieldservicestorage` (must be globally unique)
   - **Region**: Same as your App Service (e.g., East US)
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant storage) for dev, GRS for production
4. Click **Review + create** → **Create**

#### Option B: Azure CLI

```bash
# Variables
RESOURCE_GROUP="field-service-rg"
STORAGE_ACCOUNT="fieldservicestorage"
LOCATION="eastus"
CONTAINER_NAME="attachments"

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --output tsv

# Create container for attachments
az storage container create \
  --name $CONTAINER_NAME \
  --account-name $STORAGE_ACCOUNT \
  --public-access blob
```

### 2. Get Connection String

#### Azure Portal:
1. Go to your Storage Account
2. Navigate to **Security + networking** → **Access keys**
3. Copy the **Connection string** from key1 or key2

#### Azure CLI:
```bash
az storage account show-connection-string \
  --name fieldservicestorage \
  --resource-group field-service-rg
```

The connection string looks like:
```
DefaultEndpointsProtocol=https;AccountName=fieldservicestorage;AccountKey=YOUR_KEY_HERE;EndpointSuffix=core.windows.net
```

### 3. Configure App Service

#### Option A: Azure Portal

1. Go to your App Service
2. Navigate to **Settings** → **Environment variables**
3. Click **+ Add** and add:
   - **Name**: `AZURE_STORAGE_CONNECTION_STRING`
   - **Value**: Your connection string from step 2
4. (Optional) Add:
   - **Name**: `AZURE_STORAGE_CONTAINER_NAME`
   - **Value**: `attachments` (or your preferred container name)
5. Click **Apply** → **Confirm**
6. Restart your App Service

#### Option B: Azure CLI

```bash
az webapp config appsettings set \
  --name your-app-name \
  --resource-group field-service-rg \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=..." \
    AZURE_STORAGE_CONTAINER_NAME="attachments"

# Restart app
az webapp restart \
  --name your-app-name \
  --resource-group field-service-rg
```

### 4. Verify Configuration

After restarting your app, check the application logs:

```bash
# View logs
az webapp log tail \
  --name your-app-name \
  --resource-group field-service-rg
```

Look for:
```
✓ Azure Blob Storage configured
✓ Azure Blob Storage container "attachments" ready
✓ Using Azure Blob Storage for file uploads
```

## Local Development

For local development, you can use:

### Option 1: Azure Storage (Recommended for testing)
Add to your local `server/.env`:
```bash
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=attachments-dev
```

### Option 2: Local File Storage
Leave the Azure settings blank - the app will automatically use local file storage:
```bash
# No Azure Storage configuration = local file storage
```

⚠️ **Remember**: Local storage works fine for development but **files will be lost** in Azure App Service.

## How It Works

The application automatically detects the storage configuration:

```javascript
// Automatic detection
if (AZURE_STORAGE_CONNECTION_STRING is set) {
  → Use Azure Blob Storage (persistent)
} else {
  → Use local file storage (ephemeral in Azure)
}
```

When uploading a file:
- **Azure Blob Storage**: File is uploaded to `attachments` container with a unique name
- **Local Storage**: File is saved to `server/uploads/` folder

## Security Best Practices

### 1. Container Access Level

Set the container to **Blob** access level (not Container):
- ✅ **Blob**: Individual files can be accessed via direct URL
- ❌ **Container**: Anyone can list all files
- ❌ **Private**: Requires authentication tokens

```bash
az storage container set-permission \
  --name attachments \
  --account-name fieldservicestorage \
  --public-access blob
```

### 2. Use Managed Identity (Advanced)

Instead of connection strings, use Azure Managed Identity:

```bash
# Enable managed identity on App Service
az webapp identity assign \
  --name your-app-name \
  --resource-group field-service-rg

# Grant storage access
PRINCIPAL_ID=$(az webapp identity show --name your-app-name --resource-group field-service-rg --query principalId -o tsv)

az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $PRINCIPAL_ID \
  --scope "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/field-service-rg/providers/Microsoft.Storage/storageAccounts/fieldservicestorage"
```

Then use account name instead of connection string:
```bash
AZURE_STORAGE_ACCOUNT_NAME=fieldservicestorage
```

### 3. Restrict Network Access

Limit storage account access to your App Service:

1. Go to Storage Account → **Security + networking** → **Networking**
2. Select **Enabled from selected virtual networks and IP addresses**
3. Add your App Service's outbound IPs

## Cost Estimation

**Azure Blob Storage Pricing** (Pay-as-you-go):

| Component | Cost | Example |
|-----------|------|---------|
| Storage | $0.0184/GB/month | 10GB = $0.18/month |
| Write operations | $0.05/10,000 | 1,000 uploads = $0.005 |
| Read operations | $0.004/10,000 | 10,000 downloads = $0.004 |
| **Total** | | **~$0.19/month for 10GB** |

Comparison to local storage workarounds:
- Azure Files: $0.06/GB/month (3x more expensive)
- Premium SSD: $0.135/GB/month (7x more expensive)

## Migrating Existing Files

If you have files in local storage that you want to move to Azure Blob Storage:

### 1. Download files from App Service

```bash
# Using Kudu (App Service SSH)
# Navigate to: https://your-app-name.scm.azurewebsites.net/DebugConsole
# Download server/uploads/ folder as ZIP
```

### 2. Upload to Azure Blob Storage

```bash
az storage blob upload-batch \
  --account-name fieldservicestorage \
  --destination attachments \
  --source ./uploads \
  --pattern "*"
```

### 3. Update Database

If your database stores file paths, update them to use Azure Blob URLs:

```sql
-- Update Attachments table to use Azure Blob URLs
UPDATE Attachments
SET FilePath = 'https://fieldservicestorage.blob.core.windows.net/attachments/' + FileName
WHERE FilePath LIKE '/uploads/%'
```

## Troubleshooting

### Files not persisting in Azure App Service

**Symptom**: Files upload successfully but disappear after app restart

**Solution**: Configure Azure Blob Storage (this is expected behavior for local storage in App Service)

### "Azure Blob Storage not configured" in logs

**Cause**: `AZURE_STORAGE_CONNECTION_STRING` environment variable not set

**Solution**: Add the environment variable in App Service Configuration

### "Failed to upload to Azure Blob Storage"

**Causes**:
1. Invalid connection string
2. Container doesn't exist
3. Insufficient permissions

**Solutions**:
```bash
# Verify connection string
az storage account show-connection-string --name fieldservicestorage

# Recreate container
az storage container create --name attachments --account-name fieldservicestorage

# Check container exists
az storage container list --account-name fieldservicestorage
```

### Large file upload failures

**Cause**: File size exceeds limit (default 10MB)

**Solution**: Increase limit in `server/storage/storageManager.js`:

```javascript
limits: {
  fileSize: 50 * 1024 * 1024 // 50MB
}
```

## Monitoring & Management

### View uploaded files

```bash
# List all files in container
az storage blob list \
  --account-name fieldservicestorage \
  --container-name attachments \
  --output table
```

### Check storage usage

```bash
# Get storage account usage
az storage account show-usage \
  --resource-group field-service-rg \
  --output table
```

### Enable diagnostic logging

```bash
az storage logging update \
  --account-name fieldservicestorage \
  --log rwd \
  --retention 7 \
  --services b
```

## Additional Resources

- [Azure Blob Storage Documentation](https://docs.microsoft.com/azure/storage/blobs/)
- [Azure Storage Pricing](https://azure.microsoft.com/pricing/details/storage/blobs/)
- [Azure Storage Explorer](https://azure.microsoft.com/features/storage-explorer/) - GUI tool for managing blobs
- [Azure Storage Security Guide](https://docs.microsoft.com/azure/storage/common/storage-security-guide)
