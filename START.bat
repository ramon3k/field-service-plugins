@echo off
REM Start Field Service Management System

echo Starting Field Service Management System...
echo.

set "INSTALL_DIR=%~dp0"

REM Start the API server in a new window
echo Starting API server on port 5000...
start "Field Service API" cmd /k "cd /d %INSTALL_DIR%server && node api.cjs"

REM Wait a moment for the API to start
timeout /t 3 /nobreak >nul

REM Start the Vite dev server in a new window
echo Starting client application on port 5173...
start "Field Service Client" cmd /k "cd /d %INSTALL_DIR% && npm run dev"

echo.
echo Two windows have opened:
echo  1. API Server - port 5000
echo  2. Client Application - port 5173
echo.
echo The application will be available at: http://localhost:5173
echo.
echo Press any key to open in browser...
pause >nul
start http://localhost:5173
