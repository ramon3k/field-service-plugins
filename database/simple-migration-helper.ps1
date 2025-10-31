# PowerShell database migration using System.Data.SqlClient
# Handles Windows Auth for local SQL Express properly

param(
    [string]$AzurePassword = "CustomerPortal2025!"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Simple Database Migration to Azure" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Reminder: This creates an EMPTY database structure." -ForegroundColor Yellow
Write-Host "It does NOT migrate data from local SQL Express." -ForegroundColor Yellow
Write-Host "`nTo migrate data, use SQL Server Management Studio:" -ForegroundColor Yellow
Write-Host "  Right-click database > Tasks > Generate Scripts > Schema and Data`n" -ForegroundColor Gray

Write-Host "For now, let's just create the ActivityLog table to fix the portal:`n" -ForegroundColor Cyan

Write-Host "Run this command in Azure Portal Query Editor:" -ForegroundColor Yellow
Write-Host "  (SQL databases > FieldServiceDB > Query editor)" -ForegroundColor Gray
Write-Host "  Login: sqladmin / CustomerPortal2025!`n" -ForegroundColor Gray

$scriptPath = Join-Path $PSScriptRoot "patch-activity-log-schema.sql"
Write-Host "File to run: $scriptPath`n" -ForegroundColor Green

Write-Host "Or, run the full schema creation:" -ForegroundColor Yellow
$fullSchemaPath = Join-Path $PSScriptRoot "azure-create-full-schema.sql"
Write-Host "File: $fullSchemaPath" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Quick Start:" -ForegroundColor Cyan
Write-Host "1. Open Azure Portal Query Editor" -ForegroundColor White
Write-Host "2. Paste and run: patch-activity-log-schema.sql" -ForegroundColor White
Write-Host "3. Test portal submission!" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
