# How to Start the Field Service Application

## After Running SETUP.bat

Once SETUP.bat has completed successfully, you need to run **TWO servers**:

### 🔧 **Step 1: Start the Backend API Server**

Open a PowerShell terminal and run:

```powershell
node server/api-minimal.js
```

**You should see:**
```
🚀 Field Service API running on http://localhost:5000
📊 Database: SQL Server Express - FieldServiceDB (or NewFSDB)
🔧 Test the API: http://localhost:5000/api/test
```

⚠️ **Leave this terminal running!** This is your backend API server.

---

### 🎨 **Step 2: Start the Frontend Dev Server**

Open a **SECOND** PowerShell terminal (keep the first one running!) and run:

```powershell
npm run dev
```

**You should see:**
```
VITE v5.4.20  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

### 🌐 **Step 3: Open the Application**

Open your browser and go to:

**http://localhost:5173/**

> **Note:** The application runs on port **5173** (frontend), NOT port 5000 (backend API)

---

## Common Issues

### ❌ "npm run dev" fails with CustomerLogin.tsx errors

**Solution:** Exclude customer portal files from build:

Edit `tsconfig.json` and add:
```json
{
  "exclude": [
    "src/components/CustomerLogin.tsx",
    "src/components/CustomerPortalApp.tsx",
    "src/customer-portal-main.tsx"
  ]
}
```

### ❌ "Nothing loads at localhost:5000"

**Problem:** You're going to the wrong port!

**Solution:** 
- Port 5000 = Backend API (JSON responses only)
- **Port 5173 = Frontend Application** ← Go here!

### ❌ Backend API crashes with "Connection is not open"

**Solution:** This is usually a harmless warning. The API server should still work. Test it:

```powershell
curl http://localhost:5000/api/test
```

You should get a JSON response.

### ❌ Frontend can't connect to backend

**Check:**
1. Is `node server/api-minimal.js` running in another terminal?
2. Is it showing "running on http://localhost:5000"?
3. Does `curl http://localhost:5000/api/test` work?

---

## Quick Start Script

**Option 1: Manual (Recommended for first time)**
```powershell
# Terminal 1:
node server/api-minimal.js

# Terminal 2 (new window):
npm run dev
```

**Option 2: Single Command (Windows)**

Create `START-APP.bat`:
```batch
@echo off
start "Backend API" cmd /k node server/api-minimal.js
timeout /t 3
start "Frontend Dev" cmd /k npm run dev
echo.
echo Application starting...
echo Backend API: http://localhost:5000
echo Frontend App: http://localhost:5173
echo.
pause
```

Then just run: `START-APP.bat`

---

## Login Credentials

**Default Admin Account:**
- Username: `admin`
- Password: `admin123` (or what you set in the config wizard)

**If you used the configuration wizard:**
- Username: Check `config.json` → `AdminUsername`
- Password: Check `config.json` → `AdminPassword`

---

## Production Deployment

For production, you would:

1. Build the frontend: `npm run build`
2. Serve the `dist/` folder from the API server
3. Run: `node server/api-minimal.js` (single server)
4. Access at: http://localhost:5000

The production setup serves both frontend and API from port 5000.

---

## Troubleshooting Checklist

- [ ] SQL Server Express is running
- [ ] Database exists (FieldServiceDB or NewFSDB)
- [ ] Backend API is running (`node server/api-minimal.js`)
- [ ] Frontend dev server is running (`npm run dev`)
- [ ] Going to http://localhost:5173 (NOT 5000)
- [ ] No firewall blocking ports 5000 or 5173

---

## Need Help?

**Check if database exists:**
```powershell
sqlcmd -S localhost\SQLEXPRESS -E -Q "SELECT name FROM sys.databases"
```

**Check if ports are in use:**
```powershell
Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue
```

**Check Node processes:**
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
```

**Stop all Node processes:**
```powershell
Get-Process -Name node | Stop-Process -Force
```

---

## Summary

✅ **Development Mode** (two terminals):
- Terminal 1: `node server/api-minimal.js` → Backend at port 5000
- Terminal 2: `npm run dev` → Frontend at port 5173
- **Open:** http://localhost:5173

✅ **Production Mode** (one terminal):
- Run: `npm run build` once
- Run: `node server/api-minimal.js`
- **Open:** http://localhost:5000

---

**Remember:** In development, you ALWAYS access the app at **http://localhost:5173**, not 5000!
