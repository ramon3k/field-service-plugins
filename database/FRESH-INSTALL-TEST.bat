@echo off
REM Fresh Installation Test Script
REM This drops the existing database and recreates from scratch
REM Run this on your laptop to test the new schema

echo ========================================
echo Fresh Installation Test
echo ========================================
echo.
echo WARNING: This will DELETE your entire FieldServiceDB database!
echo.
set /p CONFIRM="Type YES to continue: "
if /i not "%CONFIRM%"=="YES" (
    echo Cancelled.
    pause
    exit /b
)

echo.
echo Dropping existing database...
sqlcmd -S localhost\SQLEXPRESS -E -Q "IF EXISTS (SELECT name FROM sys.databases WHERE name = 'FieldServiceDB') BEGIN ALTER DATABASE FieldServiceDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE FieldServiceDB; PRINT 'Database dropped successfully'; END"

if %ERRORLEVEL% NEQ 0 (
    echo Failed to drop database
    pause
    exit /b 1
)

echo.
echo Database dropped. Now run SETUP.bat to create fresh installation.
echo.
pause
