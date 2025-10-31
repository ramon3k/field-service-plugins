@echo off
REM Fix .env file to add missing DB_USER and DB_PASSWORD

echo Adding missing database credentials to .env file...

cd /d "%~dp0server"

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found
    pause
    exit /b 1
)

REM Backup current .env
copy .env .env.backup >nul

REM Add DB_USER and DB_PASSWORD if they don't exist
findstr /C:"DB_USER=" .env >nul
if errorlevel 1 (
    echo DB_USER=sa >> .env
    echo Added DB_USER=sa
)

findstr /C:"DB_PASSWORD=" .env >nul
if errorlevel 1 (
    echo DB_PASSWORD=YourSQLPasswordHere >> .env
    echo Added DB_PASSWORD=YourSQLPasswordHere
    echo.
    echo WARNING: Default placeholder password added!
    echo Please edit server\.env and replace YourSQLPasswordHere with your actual SQL Server password
)

echo.
echo .env file updated successfully
echo Backup saved as .env.backup
echo.
echo You can now run START.bat
pause
