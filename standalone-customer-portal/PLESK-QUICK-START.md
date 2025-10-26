# Quick Start: Deploy Customer Portal to Plesk

## Summary
Deploy your customer service request portal to your Plesk-hosted website in 5 easy steps.

## Prerequisites
- Plesk panel with Node.js support
- Access to your SQL Server database
- Domain or subdomain configured in Plesk

## Step 1: Prepare Deployment Package (5 minutes)

1. **Run the deployment script:**
   ```cmd
   cd standalone-customer-portal
   create-plesk-package.bat
   ```

2. **Edit the .env file** in `plesk-deployment` folder:
   - Set `DB_SERVER` to your SQL Server IP/hostname
   - Set `DB_USER` and `DB_PASSWORD` for database access
   - Set `ALLOWED_ORIGINS` to your domain (e.g., `https://yourdomain.com`)

3. **Create a ZIP file:**
   - Right-click `plesk-deployment` folder
   - Select "Send to" → "Compressed (zipped) folder"

## Step 2: Upload to Plesk (2 minutes)

1. Log into your Plesk panel
2. Go to **Domains** → **Your Domain** → **File Manager**
3. Navigate to `/httpdocs/` (or create `/httpdocs/support/`)
4. Click **Upload** and select your ZIP file
5. Click **Extract Files** after upload completes

## Step 3: Configure Database Access (5 minutes)

### On your SQL Server:

1. Run this SQL to create a portal user:
   ```sql
   CREATE LOGIN portal_user WITH PASSWORD = 'YourStrongPasswordHere';
   USE FieldServiceDB;
   CREATE USER portal_user FOR LOGIN portal_user;
   GRANT INSERT ON ServiceRequests TO portal_user;
   GRANT INSERT ON ActivityLog TO portal_user;
   GRANT SELECT ON Users TO portal_user;
   ```

2. Enable remote connections:
   - Open **SQL Server Configuration Manager**
   - Enable **TCP/IP** protocol
   - Set to listen on port **1433**
   - Add firewall rule for port **1433**
   - Restart SQL Server service

## Step 4: Configure Node.js in Plesk (3 minutes)

1. In Plesk, go to **Domains** → **Your Domain** → **Node.js**
2. Click **Enable Node.js**
3. Configure:
   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Document root**: `/httpdocs/support` (or wherever you uploaded)
   - **Application startup file**: `server.js`
4. Click **NPM Install** (this may take 1-2 minutes)
5. Click **Restart App**

## Step 5: Test Your Portal (1 minute)

1. Visit: `https://yourdomain.com/support`
2. Fill out the form with test data
3. Submit the request
4. Login to your Field Service Management System
5. Check **Service Requests** page - you should see your test request!

---

## Troubleshooting

### Portal won't load
- Check Node.js logs in Plesk: **Domains** → **Node.js** → **Logs**
- Verify `.env` file has correct values
- Ensure `server.js` exists in the upload directory

### Database connection error
- Verify SQL Server allows remote connections (TCP/IP enabled)
- Check firewall allows port 1433
- Test connection: `sqlcmd -S your-server -U portal_user -P password`
- Verify `DB_SERVER`, `DB_USER`, `DB_PASSWORD` in `.env`

### Form submits but nothing saves
- Check database user has INSERT permissions
- View Node.js application logs
- Verify `COMPANY_CODE` matches your setup

### CORS error in browser console
- Update `ALLOWED_ORIGINS` in `.env` to match your domain exactly
- Include `https://` protocol
- Restart the app after changing `.env`

---

## Security Checklist

Before going live:
- [ ] SSL certificate enabled (Plesk can install Let's Encrypt for free)
- [ ] `ALLOWED_ORIGINS` restricted to your domain only (not `*`)
- [ ] Database user has minimal permissions (INSERT only)
- [ ] `NODE_ENV` set to `production`
- [ ] Strong password for `DB_PASSWORD`
- [ ] SQL Server firewall configured
- [ ] Test from external network

---

## Optional: Custom Domain Path

To use a custom path like `/request-service` instead of `/support`:

1. Upload files to `/httpdocs/request-service/`
2. Update proxy configuration in Plesk
3. Visit: `https://yourdomain.com/request-service`

## Optional: Subdomain Setup

For a cleaner URL like `support.yourdomain.com`:

1. In Plesk: **Domains** → **Add Subdomain**
2. Create subdomain: `support`
3. Upload portal files to subdomain's document root
4. Configure Node.js for the subdomain
5. Enable SSL for subdomain
6. Visit: `https://support.yourdomain.com`

---

## Need Help?

1. Check `PLESK-DEPLOYMENT.md` for detailed instructions
2. Review Node.js logs in Plesk
3. Test database connectivity from Plesk server
4. Verify all environment variables are set correctly

---

**Total Deployment Time: ~15 minutes**

Once deployed, customers can submit service requests 24/7, and they'll appear instantly in your Field Service Management System!
