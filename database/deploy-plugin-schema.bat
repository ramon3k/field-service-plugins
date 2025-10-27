@echo off
REM Deploy Plugin System Schema to SQL Server

echo Deploying Plugin System Schema...
echo.

sqlcmd -S "RAMONPC\SQLEXPRESS" -d "FieldServiceDB" -E -i "plugin-system-schema.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Plugin system schema deployed successfully!
    echo.
) else (
    echo.
    echo ❌ Schema deployment failed with exit code: %ERRORLEVEL%
    echo.
    pause
    exit /b %ERRORLEVEL%
)

pause
