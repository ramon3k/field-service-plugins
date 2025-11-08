@echo off
REM Plugin Development Mode - Hot Reload System
REM This script enables live plugin development with automatic reloading

cd /d "%~dp0"

echo.
echo ========================================
echo  Plugin Development Mode
echo  Hot Reload System
echo ========================================
echo.
echo This mode allows you to:
echo  - Edit plugin files in real-time
echo  - Auto-reload plugins when files change
echo  - Skip the zip/install/uninstall cycle
echo  - See changes immediately
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js first.
    pause
    exit /b 1
)

echo Starting Plugin Development System...
echo.
echo Press Ctrl+C to stop watching
echo.

REM Start the Vite dev server in a new window
start "Frontend (Vite)" cmd /k "npm run dev"

REM Start the plugin watcher
node scripts\plugin-dev-mode.cjs

pause
