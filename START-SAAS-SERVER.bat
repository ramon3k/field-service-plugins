@echo off
title DCPSP Field Service - Multi-Tenant SaaS Server
echo.
echo ================================================
echo   DCPSP Field Service - Multi-Tenant SaaS
echo ================================================
echo.

REM Change to server directory
cd /d "%~dp0server"

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Install dependencies if needed
if not exist "node_modules" (
    echo.
    echo 📦 Installing server dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies already installed
)

REM Install additional SaaS dependencies
echo.
echo 📦 Installing SaaS dependencies...
call npm install bcrypt jsonwebtoken cors --save >nul 2>&1

echo.
echo 🚀 Starting Multi-Tenant SaaS Server...
echo.
echo Server will be available at:
echo   🌐 Web App: http://localhost:3001
echo   📡 API: http://localhost:3001/api
echo.
echo Features:
echo   🏢 Multi-tenant architecture
echo   🔐 Tenant-based authentication  
echo   💾 Distributed customer databases
echo   ⚡ Real-time tenant switching
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the SaaS server
node saas-server.js

REM If we get here, the server stopped
echo.
echo 🛑 Server stopped
pause