#!/bin/bash
# Plesk Deployment Script for Customer Portal
# This script helps prepare the portal for deployment to Plesk

echo "=================================="
echo "Customer Portal - Plesk Deployment"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "server.js" ] || [ ! -f "package.json" ]; then
    echo "ERROR: This script must be run from the standalone-customer-portal directory"
    exit 1
fi

echo "Step 1: Creating deployment package..."
echo ""

# Create deployment directory
DEPLOY_DIR="plesk-deployment"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy necessary files
cp server.js $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp .env.example $DEPLOY_DIR/.env
cp -r public $DEPLOY_DIR/

# Create production .env with placeholders
cat > $DEPLOY_DIR/.env << 'EOF'
# ===== PLESK DEPLOYMENT CONFIGURATION =====
# UPDATE THESE VALUES FOR YOUR SERVER

# Database Settings (REQUIRED - Update these!)
DB_SERVER=YOUR_SQL_SERVER_IP_OR_HOSTNAME
DB_NAME=FieldServiceDB
DB_USER=portal_user
DB_PASSWORD=CHANGE_THIS_PASSWORD

# Company Code (REQUIRED)
COMPANY_CODE=KIT

# Server Port (Leave as 3000 for Plesk)
PORT=3000

# CORS Settings (REQUIRED - Update to your domain!)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Environment
NODE_ENV=production
EOF

# Create README for deployment
cat > $DEPLOY_DIR/DEPLOYMENT-INSTRUCTIONS.txt << 'EOF'
PLESK DEPLOYMENT INSTRUCTIONS
==============================

1. UPLOAD FILES
   - Upload ALL files in this folder to your Plesk server
   - Recommended location: /httpdocs/support/ or /httpdocs/

2. EDIT .env FILE
   - Update DB_SERVER with your SQL Server address
   - Update DB_USER and DB_PASSWORD with database credentials
   - Update ALLOWED_ORIGINS with your actual domain
   - Update COMPANY_CODE if different from KIT

3. CONFIGURE NODE.JS IN PLESK
   - Go to: Domains → Your Domain → Node.js
   - Enable Node.js
   - Set Application startup file: server.js
   - Set Node.js version: 18.x or higher
   - Set Application mode: Production
   - Click "NPM Install"

4. SET ENVIRONMENT VARIABLES (Optional - instead of .env file)
   In Plesk Node.js settings, add these environment variables:
   - DB_SERVER
   - DB_NAME  
   - DB_USER
   - DB_PASSWORD
   - COMPANY_CODE
   - PORT
   - ALLOWED_ORIGINS
   - NODE_ENV

5. CONFIGURE DATABASE USER
   Run this SQL on your SQL Server:

   CREATE LOGIN portal_user WITH PASSWORD = 'YourPasswordHere';
   USE FieldServiceDB;
   CREATE USER portal_user FOR LOGIN portal_user;
   GRANT INSERT ON ServiceRequests TO portal_user;
   GRANT INSERT ON ActivityLog TO portal_user;
   GRANT SELECT ON Users TO portal_user;

6. START APPLICATION
   - In Plesk Node.js panel, click "Restart App"
   - Check logs for any errors

7. TEST
   - Visit: https://yourdomain.com/support (or your configured path)
   - Submit a test request
   - Verify it appears in your Field Service Management System

TROUBLESHOOTING
---------------
- Check Plesk logs: Domains → Node.js → Logs
- Verify SQL Server allows remote connections (TCP/IP enabled, port 1433 open)
- Test database connection from Plesk server
- Ensure ALLOWED_ORIGINS matches your domain exactly (including https://)

For detailed instructions, see PLESK-DEPLOYMENT.md
EOF

echo "✓ Deployment package created in: $DEPLOY_DIR/"
echo ""
echo "Files included:"
ls -la $DEPLOY_DIR/
echo ""
echo "=================================="
echo "NEXT STEPS:"
echo "=================================="
echo "1. Review and edit: $DEPLOY_DIR/.env"
echo "2. Zip the $DEPLOY_DIR folder"
echo "3. Upload to your Plesk server"
echo "4. Follow instructions in DEPLOYMENT-INSTRUCTIONS.txt"
echo ""
echo "For detailed deployment guide, see PLESK-DEPLOYMENT.md"
echo ""
