@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Customer Portal - Quick Start
echo ========================================
echo.

:: Check if .env exists
if not exist ".env" (
    echo [!] No .env file found. Creating from template...
    copy .env.example .env >nul 2>&1
    echo [√] Created .env file - please edit it with your database settings
    echo.
    echo Edit .env file now? (Y/N)
    choice /c YN /n /m ""
    if !errorlevel! equ 1 (
        notepad .env
    )
    echo.
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [*] Installing dependencies...
    npm install
    if !errorlevel! neq 0 (
        echo [!] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [√] Dependencies installed
    echo.
)

echo [*] Starting Customer Portal...
echo.
echo When server starts:
echo   - Open browser to http://localhost:3000
echo   - Fill out the form to test
echo   - Check ServiceRequests table in database
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

node server.js
