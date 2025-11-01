# Fresh Installation Quick Start

This guide covers installing the Field Service Management System on a fresh Windows machine.

## Prerequisites

Before you begin, ensure you have:
- Windows 10/11 or Windows Server
- Administrator access
- Internet connection

## Installation Steps

### 1. Download

Download the latest release from GitHub:
- Go to: https://github.com/ramon3k/field-service-plugins
- Click **Code** → **Download ZIP**
- Extract to: `C:\field-service-plugins-main\`

### 2. Run Setup

1. Navigate to the extracted folder
2. Right-click **SETUP.bat**
3. Select **Run as administrator**
4. Follow the interactive wizard:
   - Set SQL Server password
   - Configure company code
   - Set timezone
   - Create admin user

The setup script will automatically:
- ✅ Install Node.js (if needed)
- ✅ Install SQL Server Express (if needed)
- ✅ Run `npm install` in both root and server directories (installs `ws` package)
- ✅ Build the application
- ✅ Create database and tables
- ✅ Set up Windows service
- ✅ Create desktop shortcuts

### 3. Start the Application

After setup completes, the app will start automatically. You can also:

**Via Desktop Shortcut:**
- Double-click **Field Service System** icon on desktop

**Via Services:**
- Open Windows Services
- Find **FieldServiceAPI**
- Click **Start**

**Via Command Line:**
```bash
cd C:\field-service-plugins-main
START-PRODUCTION.bat
```

### 4. Access the Application

Open your browser and navigate to:
- **Local access:** http://localhost
- **Network access:** http://[your-server-ip]

Login with the admin credentials you created during setup.

---

## Installing Plugins

### Step 1: Upload Plugin

1. Login as System Admin or Admin
2. Click **Plugins** tab in navigation
3. Click **📦 Upload Plugin** button
4. Select your `.zip` file
5. Click **Upload**

### Step 2: Restart Server

**Via Desktop Shortcut:**
```
1. Double-click "Restart Field Service API" on desktop
```

**Via Services:**
```
1. Open Windows Services
2. Find "FieldServiceAPI"
3. Click Restart
```

**Via Command Line:**
```bash
cd C:\field-service-plugins-main
RESTART-API.bat
```

### Step 3: Install Plugin

1. Go back to **Plugins** tab
2. Find your uploaded plugin in the list
3. Click **Install** button
4. Wait for confirmation

### Step 4: Copy Frontend Files (if plugin has them)

If your plugin includes frontend components (`.tsx` and `.css` files):

```bash
# Navigate to installation directory
cd C:\field-service-plugins-main

# Copy frontend files from plugin to app
copy server\plugins\[plugin-name]\frontend\*.tsx src\components\plugins\
copy server\plugins\[plugin-name]\frontend\*.css src\components\plugins\

# Example for instant-messenger plugin:
copy server\plugins\instant-messenger\frontend\InstantMessenger.tsx src\components\plugins\
copy server\plugins\instant-messenger\frontend\InstantMessenger.css src\components\plugins\
```

### Step 5: Rebuild Application

```bash
cd C:\field-service-plugins-main
npm run build
```

### Step 6: Restart Server Again

Use any method from Step 2 above.

### Step 7: Refresh Browser

Press `Ctrl+F5` in your browser to force reload.

**Plugin is now active!** 🎉

---

## Troubleshooting

### "Cannot find module 'ws'" Error

**Cause:** npm install didn't run in the server directory.

**Fix:**
```bash
cd C:\field-service-plugins-main\server
npm install
```

Then restart the server.

### API Server Not Starting

**Cause:** Server is not running.

**Fix:**
```bash
cd C:\field-service-plugins-main\server
node api.cjs
```

Or use the Windows Service:
```
1. Windows Key + R
2. Type: services.msc
3. Find "FieldServiceAPI"
4. Right-click → Start
```

### Plugin Shows Placeholder Instead of Component

**Causes:**
1. Frontend files not copied to `src/components/plugins/`
2. Application not rebuilt after copying files
3. Component filename doesn't match expected format

**Fix:**
```bash
# 1. Verify files are copied
dir src\components\plugins\

# 2. Rebuild the app
npm run build

# 3. Restart server
RESTART-API.bat

# 4. Hard refresh browser
Ctrl+F5
```

### Can't Login After Fresh Install

**Cause:** Database not initialized or API server not running.

**Check database:**
```sql
sqlcmd -S localhost\SQLEXPRESS -E
USE FieldServiceDB;
GO
SELECT * FROM Users;
GO
```

**Check API server:**
- Open Task Manager
- Look for `node.exe` process
- If not running, start the service

### Port 80 Already in Use

**Cause:** Another application is using port 80.

**Fix:**
Edit `.env` file and change the port:
```
FRONTEND_PORT=8080
```

Then rebuild and restart.

---

## Development Mode (Optional)

If you want to run in development mode with hot reload:

### Terminal 1: Start API Server
```bash
cd C:\field-service-plugins-main\server
node api.cjs
```

### Terminal 2: Start Frontend Dev Server
```bash
cd C:\field-service-plugins-main
npm run dev
```

Access at: http://localhost:5173

**Note:** In development mode, `UNINSTALL.bat` won't stop the servers. You need to manually close the terminal windows.

---

## Next Steps

- Read **PLUGIN-DEVELOPER-GUIDE.md** to create your own plugins
- Read **PLUGIN-COMPONENT-REGISTRATION.md** to understand component registration
- Check **CHANGELOG.md** for recent updates
- Visit the GitHub repository for updates

---

## Getting Help

- **GitHub Issues:** https://github.com/ramon3k/field-service-plugins/issues
- **Documentation:** Check the `.md` files in the installation directory
- **Logs:** 
  - Installation: `install.log`
  - Setup: `setup-debug.log`
  - API Server: `server/logs/` (if configured)
