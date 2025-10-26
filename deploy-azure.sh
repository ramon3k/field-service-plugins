#!/bin/bash

# Azure Deployment Script for Field Service SaaS API
# This script deploys your multi-tenant API to Azure App Service

set -e

echo "🚀 DCPSP Field Service - Azure Deployment"
echo "========================================"

# Configuration
RESOURCE_GROUP="field-service-rg"
APP_SERVICE_PLAN="field-service-plan" 
WEB_APP_NAME="field-service-api-$(date +%s)"  # Unique name with timestamp
LOCATION="eastus"
RUNTIME="node|18-lts"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure
echo "🔐 Logging into Azure..."
az login

# Create resource group
echo "📦 Creating resource group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan
echo "⚡ Creating App Service plan: $APP_SERVICE_PLAN"
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux

# Create Web App
echo "🌐 Creating Web App: $WEB_APP_NAME"
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $WEB_APP_NAME \
    --runtime $RUNTIME

# Configure app settings
echo "⚙️  Configuring application settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --settings \
        NODE_ENV=production \
        JWT_SECRET="$(openssl rand -base64 32)" \
        PORT=8000 \
        WEBSITE_NODE_DEFAULT_VERSION="18.18.0"

# Enable HTTPS redirect
echo "🔒 Enabling HTTPS redirect..."
az webapp update \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --https-only true

# Build and prepare deployment package
echo "📦 Building deployment package..."
cd "$(dirname "$0")"

# Build frontend
echo "   Building React frontend..."
npm run build

# Prepare server files
echo "   Preparing server files..."
mkdir -p deploy-package
cp -r server/* deploy-package/
cp -r dist deploy-package/public
cp package*.json deploy-package/

# Install production dependencies
cd deploy-package
npm ci --production

# Create deployment zip
cd ..
zip -r deployment.zip deploy-package/*

# Deploy to Azure
echo "🚀 Deploying to Azure..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --src deployment.zip

# Get the app URL
APP_URL=$(az webapp show --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --query "defaultHostName" -o tsv)

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your API is now live at:"
echo "   https://$APP_URL"
echo ""
echo "📡 API endpoints:"
echo "   https://$APP_URL/api/health"
echo "   https://$APP_URL/api/tenant/register"
echo "   https://$APP_URL/api/auth/login"
echo ""
echo "🎯 Next steps:"
echo "   1. Update your React app's API base URL to: https://$APP_URL/api"
echo "   2. Configure custom domain (optional)"
echo "   3. Set up monitoring and alerts"
echo "   4. Test tenant registration and login"
echo ""
echo "💡 Resource details:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   App Service: $WEB_APP_NAME"
echo "   Plan: $APP_SERVICE_PLAN"
echo ""

# Cleanup
rm -rf deploy-package deployment.zip

echo "🧹 Cleanup completed."
echo ""
echo "⚡ Your multi-tenant SaaS API is ready for customers!"