@echo off
title DCPSP Field Service - SaaS Demo
echo.
echo ================================================================
echo   🚀 DCPSP Field Service - Multi-Tenant SaaS Demo
echo ================================================================
echo.
echo This demo shows how the ConnectWise-style SaaS architecture works:
echo.
echo 📋 DEMO SCENARIO:
echo   • You host the frontend and API centrally
echo   • Multiple companies use your hosted system
echo   • Each company connects to their own database
echo   • Complete data isolation between tenants
echo.
echo 🏢 EXAMPLE COMPANIES:
echo   • ACME001 - ACME Corporation (SQL Server on-premise)
echo   • TECH-CORP - Tech Solutions Inc (Azure SQL Database)  
echo   • SERVICES-123 - Field Services LLC (Local SQL Express)
echo.
echo 🔧 WHAT HAPPENS:
echo   1. Customer visits your hosted web app
echo   2. Enters their company code + credentials
echo   3. System routes to their specific database
echo   4. They see only their company's data
echo   5. Multiple companies can use the same hosted app
echo.
echo ⚡ BENEFITS:
echo   • You maintain ONE frontend application
echo   • Customers keep their data in their own databases
echo   • No data mixing between companies
echo   • Customers can use on-premise, cloud, or hybrid databases
echo   • Reduced IT overhead for customers
echo.
echo 🎯 BUSINESS MODEL:
echo   • Subscription per company/users
echo   • Central hosting reduces maintenance
echo   • Customers pay for software access, not infrastructure
echo   • Easy onboarding with database connection setup
echo.
echo.
echo ================================================
echo   Ready to start the demo?
echo ================================================
echo.
echo This will start:
echo   1. Multi-tenant SaaS server (handles all companies)
echo   2. React frontend (shared by all tenants)
echo.
echo After starting, you can:
echo   • Register demo companies
echo   • Test tenant isolation
echo   • See how database routing works
echo.
pause

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo 🚀 Starting SaaS Demo Environment...
echo.

REM Start SaaS server in background
echo ▶️  Starting Multi-Tenant API Server...
start "SaaS Server" cmd /c "cd /d "%~dp0" && START-SAAS-SERVER.bat"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo ▶️  Starting Frontend Application...
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo 🌐 Opening web application...
echo.
echo Access Points:
echo   • Web App: http://localhost:5173
echo   • SaaS API: http://localhost:3001/api
echo.
echo 📋 To test the multi-tenant features:
echo.
echo   1. Click "Register Your Company"
echo   2. Enter a test company code (e.g., DEMO001)
echo   3. Provide database connection details
echo   4. Create admin user
echo   5. Login and test the system
echo.
echo   You can register multiple companies to see isolation!
echo.

REM Start frontend dev server
call npm run dev

echo.
echo 🛑 Demo stopped. Press any key to exit.
pause