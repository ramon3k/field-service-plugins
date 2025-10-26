# Customer Service Request Portal - Deployment Guide

## 📋 Overview

This is a **standalone, web-hostable** customer service request portal that connects to your main Field Service Management database. Customers can submit service requests without needing to log in.

**Features:**
- ✅ Standalone Node.js application (separate from main app)
- ✅ No authentication required (public submission form)
- ✅ Connects to your existing FieldServiceDB database
- ✅ Multi-tenant support via CompanyCode
- ✅ Can be hosted on any Node.js platform (Azure, AWS, IIS, etc.)
- ✅ CORS-enabled for separate domain hosting

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd standalone-customer-portal
npm install
```

### 2. Configure Database Connection
Copy `.env.example` to `.env` and edit:
```bash
copy .env.example .env
```

Edit `.env`:
```env
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=FieldServiceDB
COMPANY_CODE=KIT
PORT=3000
```

### 3. Start Server
```bash
npm start
```

### 4. Test It
Open browser: **http://localhost:3000**

Fill out the form and submit. Check your `ServiceRequests` table in the database.

---

## 🌐 Production Deployment Options

### Option 1: Azure App Service (Recommended)

**Best for:** Scalable cloud hosting with automatic SSL certificates

#### Step 1: Create Azure App Service
```bash
# Using Azure CLI
az login
az group create --name customer-portal-rg --location eastus
az appservice plan create --name customer-portal-plan --resource-group customer-portal-rg --sku B1 --is-linux
az webapp create --resource-group customer-portal-rg --plan customer-portal-plan --name knight-service-portal --runtime "NODE|18-lts"
```

#### Step 2: Configure Environment Variables
In Azure Portal → App Service → Configuration → Application Settings:
```
DB_SERVER = yourserver.database.windows.net
DB_NAME = FieldServiceDB
DB_USER = portal_user
DB_PASSWORD = your_password
DB_ENCRYPT = true
COMPANY_CODE = KIT
PORT = 8080
ALLOWED_ORIGINS = https://knight-service-portal.azurewebsites.net
```

#### Step 3: Deploy Code
```bash
# Method A: Git deployment (recommended)
git init
git add .
git commit -m "Initial customer portal"
az webapp deployment source config-local-git --name knight-service-portal --resource-group customer-portal-rg
git remote add azure https://knight-service-portal.scm.azurewebsites.net/knight-service-portal.git
git push azure main

# Method B: ZIP deployment
zip -r portal.zip . -x "node_modules/*"
az webapp deployment source config-zip --resource-group customer-portal-rg --name knight-service-portal --src portal.zip
```

#### Step 4: Enable HTTPS
Azure App Service provides free SSL certificates automatically.

**Your portal URL:** https://knight-service-portal.azurewebsites.net

---

### Option 2: Windows IIS Server

**Best for:** On-premises hosting on Windows Server

#### Prerequisites
1. Install [IIS URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Install [iisnode](https://github.com/Azure/iisnode/releases)
3. Install [Node.js](https://nodejs.org/) (LTS version)

#### Step 1: Prepare Application
```powershell
cd standalone-customer-portal
npm install --production
```

#### Step 2: Configure IIS
1. Open **IIS Manager**
2. Create new website:
   - Site name: `CustomerServicePortal`
   - Physical path: `C:\inetpub\wwwroot\customer-portal`
   - Binding: Port 80 (or 443 for HTTPS)
3. Copy all files to `C:\inetpub\wwwroot\customer-portal`

#### Step 3: Configure Environment
Create `.env` file in `C:\inetpub\wwwroot\customer-portal`:
```env
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=FieldServiceDB
COMPANY_CODE=KIT
PORT=80
ALLOWED_ORIGINS=*
```

#### Step 4: Set Permissions
```powershell
# Grant IIS_IUSRS permissions
icacls "C:\inetpub\wwwroot\customer-portal" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

#### Step 5: Test
Open browser: **http://yourserver.com**

**Troubleshooting IIS:**
- Check `C:\inetpub\wwwroot\customer-portal\iisnode` for logs
- Ensure Node.js is in system PATH
- Verify SQL Server allows local connections

---

### Option 3: Shared Hosting (cPanel/Plesk)

**Best for:** Budget hosting with Node.js support

#### Requirements
- Node.js support (check with hosting provider)
- MySQL or SQL Server access
- SSH access (recommended)

#### Step 1: Upload Files
1. FTP or upload via cPanel File Manager:
   - Upload all files to `public_html/portal/`
   - Do NOT upload `node_modules/`

#### Step 2: Install Dependencies
```bash
# SSH into server
cd public_html/portal
npm install --production
```

#### Step 3: Configure Environment
Create `.env` file:
```env
DB_SERVER=yourhost.database.provider.com
DB_NAME=FieldServiceDB
DB_USER=db_user
DB_PASSWORD=db_password
DB_ENCRYPT=true
COMPANY_CODE=KIT
PORT=3000
```

#### Step 4: Start with PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name customer-portal

# Make it auto-start on reboot
pm2 save
pm2 startup
```

#### Step 5: Configure Apache/Nginx Reverse Proxy
**Apache `.htaccess`:**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

**Nginx:**
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

### Option 4: AWS Elastic Beanstalk

**Best for:** AWS infrastructure

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init customer-portal --platform node.js

# Create environment
eb create production-env

# Set environment variables
eb setenv DB_SERVER=yourserver.com DB_NAME=FieldServiceDB DB_USER=user DB_PASSWORD=pass COMPANY_CODE=KIT

# Deploy
eb deploy
```

---

### Option 5: Heroku

**Best for:** Fast deployment and free tier

```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create knight-service-portal

# Set environment variables
heroku config:set DB_SERVER=yourserver.com
heroku config:set DB_NAME=FieldServiceDB
heroku config:set DB_USER=portal_user
heroku config:set DB_PASSWORD=your_password
heroku config:set DB_ENCRYPT=true
heroku config:set COMPANY_CODE=KIT

# Deploy
git push heroku main

# Open in browser
heroku open
```

---

## 🔒 Security Considerations

### 1. Database User Permissions
Create a **limited-privilege** database user for the portal:

```sql
-- Create read-only user with write access only to ServiceRequests
CREATE LOGIN portal_user WITH PASSWORD = 'SecurePassword123!';
USE FieldServiceDB;
CREATE USER portal_user FOR LOGIN portal_user;

-- Grant minimum required permissions
GRANT SELECT ON dbo.ServiceRequests TO portal_user;
GRANT INSERT ON dbo.ServiceRequests TO portal_user;
GRANT SELECT ON dbo.ActivityLog TO portal_user;
GRANT INSERT ON dbo.ActivityLog TO portal_user;
```

### 2. CORS Configuration
**Production:** Restrict to specific domains
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Development:** Allow all (testing only)
```env
ALLOWED_ORIGINS=*
```

### 3. HTTPS (SSL)
Always use HTTPS in production:
- **Azure:** Automatic SSL certificates
- **IIS:** Use Let's Encrypt or purchase certificate
- **Shared Hosting:** Usually included

### 4. Rate Limiting
Add rate limiting middleware to prevent spam:

```bash
npm install express-rate-limit
```

In `server.js`, add:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

app.use('/api/service-requests/submit', limiter);
```

### 5. Input Validation
The portal includes basic validation, but consider adding:
- Email verification
- CAPTCHA (reCAPTCHA) for spam prevention
- Phone number validation
- Content filtering for profanity/spam

---

## 📊 Database Requirements

The portal requires these tables in your database:

1. **ServiceRequests** table (with CompanyCode column)
2. **ActivityLog** table (with CompanyCode column)
3. **Users** table (for system_001 user reference)

If you ran the main app installer (SETUP.bat), these are already configured.

---

## 🔧 Customization

### Change Branding
Edit `public/index.html`:
- Line 6: Update `<title>` tag
- Line 169: Update company name in heading
- CSS gradient colors (lines 11-12)

### Change API URL (Separate API hosting)
Edit `public/index.html`, line 287:
```javascript
const API_BASE_URL = 'https://your-api-domain.com';
```

### Add Custom Fields
1. Edit `public/index.html` - add form fields
2. Edit `server.js` - update INSERT query to include new fields
3. Update database schema if needed

---

## 📈 Monitoring

### Health Check Endpoint
Check if server is running:
```bash
curl https://your-domain.com/health
```

Response:
```json
{
  "status": "ok",
  "service": "Customer Service Request Portal",
  "timestamp": "2025-10-16T12:00:00.000Z",
  "database": "connected"
}
```

### View Logs
- **Azure:** App Service → Monitoring → Log Stream
- **IIS:** Check `iisnode/` directory
- **PM2:** `pm2 logs customer-portal`
- **Heroku:** `heroku logs --tail`

---

## 🐛 Troubleshooting

### "Database connection not available"
- Check `.env` file exists and has correct credentials
- Test SQL Server connection from hosting server
- Verify SQL Server allows remote connections
- Check firewall rules

### CORS Errors in Browser
- Update `ALLOWED_ORIGINS` in `.env`
- Ensure browser domain matches allowed origin
- Check browser console for specific error

### "Cannot find module 'express'"
- Run `npm install` in the deployment directory
- Ensure `node_modules/` is present
- Check Node.js version compatibility

### IIS "500 Internal Server Error"
- Check `iisnode/` logs directory
- Verify iisnode module is installed
- Ensure Node.js is accessible from IIS
- Check `.env` file permissions

### Form Submission Fails
- Check browser console for errors
- Verify API endpoint URL in `index.html`
- Test health endpoint: `/health`
- Check database table exists: `ServiceRequests`

---

## 📁 File Structure

```
standalone-customer-portal/
├── server.js              # Main Node.js API server
├── package.json           # Dependencies
├── .env                   # Configuration (DO NOT COMMIT)
├── .env.example           # Configuration template
├── .gitignore             # Git exclusions
├── web.config             # IIS configuration
├── public/
│   └── index.html         # Customer-facing form
└── README-DEPLOYMENT.md   # This file
```

---

## 🎯 Next Steps

1. ✅ **Test Locally:** Run `npm start` and test at http://localhost:3000
2. 🌐 **Choose Hosting:** Pick Azure, IIS, or shared hosting
3. 🔐 **Configure Security:** Set up database user, HTTPS, CORS
4. 🚀 **Deploy:** Follow platform-specific steps above
5. 📊 **Monitor:** Check health endpoint and database entries
6. 🎨 **Customize:** Update branding and add custom fields

---

## 💡 Tips

- **Separate Domain:** Host on `support.yourdomain.com` or `portal.yourdomain.com`
- **Analytics:** Add Google Analytics to track submissions
- **Email Notifications:** Extend `server.js` to send email confirmations
- **Webhooks:** Integrate with Zapier or Power Automate for notifications
- **Database Backup:** Ensure regular backups include `ServiceRequests` table

---

## 📞 Support

For issues or questions:
- Check troubleshooting section above
- Review server logs
- Test database connectivity
- Verify environment variables

---

**Last Updated:** October 2025  
**Version:** 1.0.0  
**License:** MIT
