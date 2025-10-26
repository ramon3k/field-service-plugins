# Deploying Customer Portal to Plesk

## Prerequisites
- Plesk panel with Node.js support enabled
- Access to your domain or subdomain
- SQL Server accessible from your Plesk server (or use SQL Authentication)

## Step 1: Upload Files

1. **Zip the portal folder** (or upload via FTP/Git)
   - Include: `server.js`, `package.json`, `public/` folder, `.env.example`
   - EXCLUDE: `node_modules/` (will be installed on server)

2. **Upload to Plesk**
   - Go to: **Domains** → **yourdomain.com** → **File Manager**
   - Navigate to your document root or create subdirectory: `/support`
   - Upload and extract the files

## Step 2: Configure Node.js in Plesk

1. **Enable Node.js**
   - Go to: **Domains** → **yourdomain.com** → **Node.js**
   - Click **Enable Node.js**
   
2. **Configure Application**
   - **Node.js version**: Select latest LTS (18.x or higher)
   - **Application mode**: Production
   - **Document root**: `/httpdocs/support` (or wherever you uploaded)
   - **Application startup file**: `server.js`
   - **Application URL**: Leave blank for root, or `/support` for subdomain path

3. **Environment Variables** (Click "Show More" or "Environment Variables")
   Add these:
   ```
   DB_SERVER=your-sql-server-ip-or-hostname\SQLEXPRESS
   DB_NAME=FieldServiceDB
   COMPANY_CODE=KIT
   PORT=3000
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   NODE_ENV=production
   ```

   **If using SQL Authentication** (recommended for remote access):
   ```
   DB_SERVER=your-sql-server-ip
   DB_NAME=FieldServiceDB
   DB_USER=portal_user
   DB_PASSWORD=YourSecurePassword
   COMPANY_CODE=KIT
   PORT=3000
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   NODE_ENV=production
   ```

## Step 3: Install Dependencies

In Plesk Node.js panel:

1. Click **NPM Install** button
   - Or use SSH: `cd /var/www/vhosts/yourdomain.com/httpdocs/support && npm install`

2. Wait for installation to complete

## Step 4: Configure Proxy (if needed)

If you want the portal at a custom path like `/support`:

1. Go to **Apache & nginx Settings**
2. Add to **Additional nginx directives**:
   ```nginx
   location /support {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
   }
   ```

## Step 5: Database Access

### Option A: Windows Authentication (if SQL Server on same network)
- Ensure SQL Server allows remote connections
- Enable TCP/IP in SQL Server Configuration Manager
- Add firewall rule for port 1433

### Option B: SQL Authentication (Recommended for Plesk)
1. Create a dedicated SQL user:
   ```sql
   CREATE LOGIN portal_user WITH PASSWORD = 'SecurePassword123';
   USE FieldServiceDB;
   CREATE USER portal_user FOR LOGIN portal_user;
   GRANT INSERT ON ServiceRequests TO portal_user;
   GRANT INSERT ON ActivityLog TO portal_user;
   GRANT SELECT ON Users TO portal_user;
   ```

2. Update `.env` to use SQL Authentication (see environment variables above)

## Step 6: Update server.js for SQL Authentication

If using SQL Authentication, the connection string in `server.js` needs to be updated.

Replace the connectionString line with:
```javascript
const connectionString = process.env.DB_USER 
  ? `server=${DB_SERVER};Database=${DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD};Driver={SQL Server Native Client 11.0}`
  : `server=${DB_SERVER};Database=${DB_NAME};Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}`;
```

## Step 7: Start Application

1. In Plesk Node.js panel, click **Enable Node.js** (if not already enabled)
2. Click **Restart App**
3. Check logs for any errors

## Step 8: Test

1. Visit: `https://yourdomain.com/support` (or your configured path)
2. Fill out the form
3. Submit a test request
4. Verify it appears in your Field Service Management System

## Troubleshooting

### Application won't start
- Check logs in Plesk: **Domains** → **Node.js** → **Logs**
- Verify `package.json` and `server.js` exist
- Ensure all environment variables are set

### Database connection fails
- Check DB_SERVER is accessible from Plesk server
- Verify SQL Server allows remote connections (TCP/IP enabled)
- Test connection: `sqlcmd -S your-server -U portal_user -P password -Q "SELECT 1"`
- Check firewall allows port 1433

### Form submits but nothing saves
- Check database user has INSERT permissions
- View application logs in Plesk
- Check ActivityLog table for errors

### 502 Bad Gateway
- Verify PORT environment variable matches proxy configuration
- Restart the Node.js application
- Check if port 3000 is available

## Security Checklist

- ✅ SSL certificate installed (Let's Encrypt via Plesk)
- ✅ ALLOWED_ORIGINS set to your domain only
- ✅ Database user has minimal permissions (INSERT only)
- ✅ Firewall configured to allow only necessary traffic
- ✅ NODE_ENV set to "production"

## Alternative: Subdomain Setup

For cleaner URLs like `support.yourdomain.com`:

1. **Create subdomain** in Plesk: **Domains** → **Add Subdomain**
2. **Upload portal** to subdomain's document root
3. **Configure Node.js** for that subdomain
4. **Enable SSL** for subdomain (Let's Encrypt)
5. Access at: `https://support.yourdomain.com`

## Updating the Portal

1. Upload new files via FTP/File Manager
2. In Plesk Node.js panel, click **Restart App**
3. Clear browser cache and test

## Support

For issues:
1. Check Plesk logs: **Domains** → **Node.js** → **Logs**
2. Check application logs in `/httpdocs/support/logs/`
3. Test database connectivity from Plesk server
