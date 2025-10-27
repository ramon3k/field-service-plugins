@echo off
REM Deploy Time Clock Plugin

echo ========================================
echo Deploying Time Clock Plugin
echo ========================================
echo.

echo Step 1: Creating plugin database tables...
sqlcmd -S "RAMONPC\SQLEXPRESS" -d "FieldServiceDB" -E -i "schema.sql"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to create plugin tables
    pause
    exit /b 1
)

echo.
echo Step 2: Registering plugin in GlobalPlugins...
sqlcmd -S "RAMONPC\SQLEXPRESS" -d "FieldServiceDB" -E -i "install.sql"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to register plugin
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Time Clock Plugin Deployed Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Restart the Node.js server
echo 2. The plugin will auto-load on startup
echo 3. Test with: curl http://127.0.0.1:5000/api/plugins
echo.

pause
