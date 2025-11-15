@echo off
setlocal EnableDelayedExpansion

:: Start Application Script
:: Starts the Field Service Management System

echo.
echo ==========================================
echo Starting Field Service Management System
echo ==========================================
echo.

set "INSTALL_DIR=%~dp0.."
set "DB_NAME=FieldServiceDB"
set "SQL_INSTANCE=.\SQLEXPRESS"

echo Installation Directory: %INSTALL_DIR%
echo.

:: Check if SQL Server is running
echo Checking SQL Server status...
sc query "MSSQL$SQLEXPRESS" | find "RUNNING" >nul
if %errorLevel% neq 0 (
    echo Starting SQL Server Express...
    net start "MSSQL$SQLEXPRESS"
    if !errorLevel! neq 0 (
        echo ERROR: Could not start SQL Server Express
        echo Please check the service in Windows Services
        pause
        exit /b 1
    )
    timeout /t 5 /nobreak >nul
)
echo [√] SQL Server Express is running

:: Test database connection
echo Testing database connection...
sqlcmd -S "%SQL_INSTANCE%" -d "%DB_NAME%" -Q "SELECT 1" >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Cannot connect to database %DB_NAME%
    echo Please run create-database.bat if this is first time setup
    pause
    exit /b 1
)
echo [√] Database connection successful

:: Check if Node.js is available
echo Checking Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js not found
    echo Please install Node.js or run SETUP.bat
    pause
    exit /b 1
)
echo [√] Node.js is available

:: Check if application files exist
if not exist "%INSTALL_DIR%\server\api-server.js" (
    echo ERROR: Application files not found
    echo Expected: %INSTALL_DIR%\server\api-server.js
    pause
    exit /b 1
)
echo [√] Application files found

:: Check if port 5000 is available
netstat -an | find ":5000 " | find "LISTENING" >nul
if %errorLevel% equ 0 (
    echo WARNING: Port 5000 is already in use
    echo The application may already be running or another service is using this port
    
    choice /c YN /m "Do you want to continue anyway"
    if !errorLevel! neq 1 (
        echo Startup cancelled
        pause
        exit /b 1
    )
) else (
    echo [√] Port 5000 is available
)

:: Change to server directory and start application
echo.
echo Starting application server...
cd /d "%INSTALL_DIR%\server"

:: Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --production
    if !errorLevel! neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ==========================================
echo Application Starting...
echo ==========================================
echo.
echo Web URL: http://localhost:5000
echo Database: %DB_NAME%
echo.
echo Default Login:
echo Username: admin
echo Password: admin123
echo.
echo Press Ctrl+C to stop the application
echo.

:: Start the application
node api-server.js

echo.
echo Application stopped.
pause