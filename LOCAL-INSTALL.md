# Local Installation Guide

This guide walks you through installing the Field Service Management System on a **local Windows machine** without any cloud services.

## Prerequisites

- **Windows 10 or later** (or Windows Server 2016+)
- **Administrator privileges** (required for SQL Server and service installation)
- **4GB RAM minimum** (8GB recommended)
- **5GB free disk space**

> **Note**: The installer will automatically download and install SQL Server Express and Node.js if they're not already present.

## Quick Start (5 Minutes)

### Pre-Flight Check (Optional but Recommended)

Before installing, verify your system is ready:
```
Right-click PRE-FLIGHT-CHECK.bat → Run as administrator
```

This will check for:
- Administrator privileges
- Internet connection (for auto-downloads)
- Disk space
- Existing SQL Server / Node.js installations
- Port availability

### Installation Steps

1. **Download the release**
   - Go to [Releases](https://github.com/ramon3k/field-service-plugins/releases/latest)
   - Download `field-service-plugins-vX.Y.Z.zip`
   - Extract to a **local folder** (e.g., `C:\FieldService\`)
   
   > **⚠️ Important**: Extract to a local drive (C:\, D:\, etc.), **NOT** to:
   > - OneDrive, Dropbox, or other cloud sync folders
   > - Network drives or mapped drives
   > - USB drives (can work but may be slower)
   > 
   > Cloud sync folders can interfere with the installer and database files.

2. **Run the installer**
   - Right-click `SETUP.bat`
   - Select **"Run as administrator"**
   - Follow the prompts
   - If download fails, the installer will show you exactly what to download and where to put it

3. **Access the application**
   - Open browser to `http://localhost:5000`
   - Login with the admin credentials you created during setup

That's it! The app is now running locally on your machine.

---

## Detailed Installation Steps

### Step 1: Extract Files

Extract the downloaded ZIP to a permanent location:
```
C:\FieldService\
```

> **Important**: Do NOT extract to `Downloads` or `Desktop` — choose a stable directory.

### Step 2: Run SETUP.bat

1. Navigate to the extracted folder
2. Right-click `SETUP.bat`
3. Select **"Run as administrator"**

The installer will:
- Check system requirements
- Install SQL Server Express (if not present)
- Install Node.js v18+ (if not present)
- Run the configuration wizard
- Create the database
- Install dependencies
- Optionally register as a Windows Service

### Step 3: Configuration Wizard

The wizard will prompt for:

**Company Information**
- Company name (e.g., "ACME Service Co.")
- Display name (optional, used in UI)

**Database Settings**
- Database name (default: `FieldServiceDB`)
- Server instance (default: `localhost\SQLEXPRESS`)

**Application Ports**
- API port (default: `5000`)
- Frontend port (default: `5173` for dev, served via API in production)

**Administrator Account**
- Username
- Email
- Full name
- Password (must be strong)

**Backup Directory**
- Path for database backups (default: `C:\FieldServiceBackups`)

### Step 4: Wait for Installation

The installer will:
1. Create the database on SQL Server Express
2. Run schema migrations
3. Create the admin user
4. Install Node.js dependencies (npm install)
5. Build the frontend (if not pre-built)

**Estimated time**: 5-10 minutes

### Step 5: Start the Application

**Option A: Run manually** (for testing/development)
```powershell
cd server
node api.cjs
```

**Option B: Windows Service** (recommended for production)

If you installed as a service during setup:
```powershell
net start FieldServiceAPI
```

The service will auto-start on boot.

### Step 6: Access the Application

Open your browser to:
```
http://localhost:5000
```

Login with the admin credentials you created.

---

## Local-Only Architecture

```
┌─────────────────────────────────────┐
│   Browser (localhost:5000)          │
└──────────────┬──────────────────────┘
               │ HTTP
               ▼
┌─────────────────────────────────────┐
│   Node.js API Server (port 5000)    │
│   - Express REST API                │
│   - Serves frontend (dist/)         │
│   - Plugin system                   │
└──────────────┬──────────────────────┘
               │ TDS (SQL)
               ▼
┌─────────────────────────────────────┐
│   SQL Server Express                │
│   localhost\SQLEXPRESS              │
│   - FieldServiceDB                  │
│   - Windows Authentication          │
└─────────────────────────────────────┘
```

**No cloud services required**:
- ✅ All data stays on your local machine
- ✅ No internet required after installation
- ✅ No recurring cloud costs
- ✅ Full control over your data

---

## Post-Installation Configuration

### Add Users

1. Login as admin
2. Navigate to **Users** tab
3. Click **Add User**
4. Fill in details and assign role (Technician, Dispatcher, Admin)

### Upload Plugins (Optional)

1. Navigate to **Plugins** tab
2. Click **Upload Plugin**
3. Select `time-clock-plugin.zip` (included in release)
4. Click **Install** → **Enable** → **Reload Plugins**

### Create Your First Ticket

1. Go to **Customers** → **Add Customer**
2. Add a site for the customer
3. Go to **Tickets** → **New Ticket**
4. Assign to a technician and start working!

---

## Running the App

### Manual Start (Development)

```powershell
# Start API server
cd C:\FieldService\server
node api.cjs

# Access at http://localhost:5000
```

### Windows Service (Production)

```powershell
# Start
net start FieldServiceAPI

# Stop
net stop FieldServiceAPI

# Check status
sc query FieldServiceAPI
```

### Service Configuration

If you want to change service settings:
```powershell
sc config FieldServiceAPI start= auto    # Auto-start on boot
sc config FieldServiceAPI start= demand  # Manual start
```

---

## Database Management

### Connect to Local Database

**SQL Server Management Studio (SSMS)**:
- Server: `localhost\SQLEXPRESS`
- Authentication: **Windows Authentication**
- Database: `FieldServiceDB`

**Command Line (sqlcmd)**:
```powershell
sqlcmd -S localhost\SQLEXPRESS -d FieldServiceDB -E
```

### Backup Database

**Automatic backups** are configured during installation to:
```
C:\FieldServiceBackups\
```

**Manual backup**:
```sql
BACKUP DATABASE FieldServiceDB 
TO DISK = 'C:\FieldServiceBackups\FieldServiceDB_Manual.bak'
WITH FORMAT, INIT, NAME = 'Manual Backup';
```

### Restore Database

```sql
USE master;
GO
RESTORE DATABASE FieldServiceDB 
FROM DISK = 'C:\FieldServiceBackups\FieldServiceDB_2025-10-27.bak'
WITH REPLACE;
```

---

## Troubleshooting

### Installer Closes Immediately

**Cause**: Not running as administrator
- **Solution**: Right-click SETUP.bat and select "Run as administrator"

**Cause**: Missing installers and no internet connection
- **Solution**: 
  1. Download SQL Server Express: https://go.microsoft.com/fwlink/?linkid=866658
  2. Save as `installers\SQLEXPR_x64_ENU.exe`
  3. Download Node.js: https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi
  4. Save in `installers\` folder
  5. Run SETUP.bat again

**Cause**: PowerShell execution policy blocking downloads
- **Solution**: Run PRE-FLIGHT-CHECK.bat first to identify issues

### "Download Failed" Error

The installer will show you exactly what to download and where to put it. Follow the on-screen instructions.

**Common causes**:
- No internet connection → Download installers manually
- Firewall blocking downloads → Temporarily disable or download manually
- Proxy server → Download installers manually from work computer

### "SQL Server Installation Failed"

**Check if SQL Server is already installed**:
```powershell
sc query MSSQL$SQLEXPRESS
```

If it says "running", SQL Server is already there. Run SETUP.bat again—it will skip the SQL installation.

**If installation truly failed**:
- Check `install.log` in the installation folder for details
- Try installing SQL Server manually: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- Choose "Express" edition, "Basic" install type

### "SQL Server not found"
- Open **Services** (services.msc)
- Find **SQL Server (SQLEXPRESS)**
- Right-click → **Start**
- Set Startup Type to **Automatic**

### "Port 5000 already in use"
Edit `server/.env`:
```
PORT=5001
```
Or run CONFIGURE.bat to change the port.

### "Cannot connect to database"
1. Verify SQL Server is running (services.msc)
2. Check Windows Firewall isn't blocking SQL (port 1433)
3. Ensure Windows Authentication is enabled
4. Run `enable-sql-tcp.bat` to enable TCP/IP protocol

### "Node.js not found" after installation
- Close and reopen your terminal/command prompt
- Check: `node --version`
- If still not found, restart your computer
- Manually download from: https://nodejs.org/

### "Permission denied" errors
- Ensure you ran SETUP.bat **as Administrator**
- Grant your Windows user account permissions to the installation folder

### Still Having Issues?

1. **Run PRE-FLIGHT-CHECK.bat** to diagnose
2. **Check install.log** in the application folder
3. **Try manual installation** of SQL Server and Node.js first, then run SETUP.bat

---

## Updating the Application

1. Download the new release ZIP
2. **Backup your database first!**
3. Stop the service: `net stop FieldServiceAPI`
4. Extract new files (overwrite old ones, keep `config.json`)
5. Run `UPDATE.bat` as administrator
6. Start the service: `net start FieldServiceAPI`

> **Tip**: Your database and config.json are preserved during updates.

---

## Uninstalling

Run `UNINSTALL.bat` as administrator to:
- Stop and remove the Windows Service
- Optionally remove the database
- Clean up installed files

**Before uninstalling**:
- Backup your database if you want to keep the data
- Export any reports or data you need

---

## Network Access (Optional)

By default, the application is only accessible from the local machine (`localhost`). To allow other computers on your network to access it:

### Quick Setup (Automated Script)

1. **Run the network setup script** as Administrator:
   ```powershell
   .\setup-network-access.ps1
   ```

2. **Restart your computer** (if you changed the hostname)

3. **Start both servers**:
   ```powershell
   # Terminal 1: Start API server
   npm start
   
   # Terminal 2: Start frontend dev server
   npm run dev
   ```

4. **Access from other machines**:
   ```
   http://YOUR-HOSTNAME:5173
   ```

### Manual Setup

If you prefer to configure manually:

#### 1. Create `.env` file

Create a `.env` file in the application root (if it doesn't exist):

```bash
# Copy the example file
Copy-Item .env.example .env
```

Edit `.env` and set:
```
VITE_API_URL=http://YOUR-HOSTNAME:5000/api
```

Replace `YOUR-HOSTNAME` with your computer's hostname (e.g., `workzown`).

> **Note**: The `.env` file is NOT committed to GitHub (it's in `.gitignore`) because it contains environment-specific settings. Each installation needs its own `.env` file.

#### 2. Configure Vite for Network Access

The `vite.config.ts` should already have these settings (included in the release):

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
    allowedHosts: ['YOUR-HOSTNAME', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  }
})
```

Replace `YOUR-HOSTNAME` with your actual hostname in the `allowedHosts` array.

#### 3. Configure Windows Firewall

Allow inbound connections on required ports:

```powershell
# API Server (port 5000)
New-NetFirewallRule -DisplayName "Field Service API Server" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

# Frontend Dev Server (port 5173)
New-NetFirewallRule -DisplayName "Field Service Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

#### 4. Optional: Set a Custom Hostname

To make it easier for users to access (e.g., `http://workzown:5173` instead of `http://192.168.1.100:5173`):

```powershell
# Rename computer (requires Administrator)
Rename-Computer -NewName "workzown" -Force

# Restart computer for hostname change to take effect
Restart-Computer
```

#### 5. Start Both Servers

```powershell
# Terminal 1: Start API server (already on 0.0.0.0)
npm start

# Terminal 2: Start frontend dev server (now on 0.0.0.0)
npm run dev
```

### Accessing from Client Machines

#### Option 1: Using Hostname
```
http://workzown:5173
```
(Replace `workzown` with your server's hostname)

#### Option 2: Using IP Address
```
http://192.168.1.100:5173
```
(Replace with your server's actual IP address)

### Network Architecture

```
┌─────────────────────────────────────┐
│   Client Browser                    │
│   http://workzown:5173             │
└──────────────┬──────────────────────┘
               │ HTTP
               ▼
┌─────────────────────────────────────┐
│   Vite Dev Server (port 5173)       │
│   Running on: 0.0.0.0:5173         │
│   Allowed hosts: workzown, etc.    │
└──────────────┬──────────────────────┘
               │ Proxy /api requests
               ▼
┌─────────────────────────────────────┐
│   Node.js API Server (port 5000)    │
│   Running on: 0.0.0.0:5000         │
└──────────────┬──────────────────────┘
               │ TDS (SQL)
               ▼
┌─────────────────────────────────────┐
│   SQL Server Express                │
│   localhost\SQLEXPRESS              │
└─────────────────────────────────────┘
```

### Troubleshooting Network Access

#### Can't connect from other machines

1. **Run diagnostics on the server**:
   ```powershell
   .\diagnose-network.ps1
   ```

2. **Run diagnostics from client**:
   ```powershell
   .\test-from-client.ps1
   ```

#### Port 5173 shows as closed

- Make sure you **stopped and restarted** `npm run dev` after changing `vite.config.ts`
- Vite must be configured with `host: '0.0.0.0'` to accept network connections
- Check firewall rule exists: `Get-NetFirewallRule -DisplayName "Field Service Dev Server"`

#### "Blocked request" error

- Add your hostname to `allowedHosts` array in `vite.config.ts`
- Restart the dev server after making changes

#### Hostname not resolving

- Verify computer was restarted after hostname change
- Try using IP address instead
- Check that both computers are on the same network/subnet
- Add manual entry to client's hosts file (optional):
  ```
  C:\Windows\System32\drivers\etc\hosts
  
  192.168.1.100   workzown
  ```

#### Database connection issues from network

The SQL Server connection remains local (localhost) - only the API and frontend are exposed to the network. This is by design for security.

---

## Performance Tips

### Dedicated Machine
For best performance, install on a dedicated Windows server or workstation that stays on 24/7.

### SQL Server Optimization
- Allocate more RAM to SQL Server (SQL Configuration Manager)
- Set database auto-growth to avoid fragmentation
- Schedule regular index maintenance

### Node.js Process
- Use the Windows Service (auto-restart on crash)
- Monitor CPU/RAM usage in Task Manager
- Consider PM2 for advanced process management

---

## Next Steps

- ✅ Installed locally? Great! Now add users and start creating tickets.
- 📚 See [README.md](README.md) for feature overview
- 🔌 See [docs/PLUGIN-DEVELOPMENT-GUIDE.md](docs/PLUGIN-DEVELOPMENT-GUIDE.md) to build plugins
- ☁️ See [AZURE-DEPLOYMENT-GUIDE.md](AZURE-DEPLOYMENT-GUIDE.md) if you want to move to the cloud later

---

## Support

- **Issues**: [GitHub Issues](https://github.com/ramon3k/field-service-plugins/issues)
- **Documentation**: See `docs/` folder for detailed guides
- **Community**: Check Discussions for tips and help

---

## License

This software is licensed under AGPL-3.0 with a Plugin Exception. See [LICENSE.txt](LICENSE.txt) for details.

Plugins can use any license (the included Time Clock plugin is MIT-licensed).
