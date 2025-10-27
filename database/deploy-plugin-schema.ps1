# Deploy Plugin System Schema to SQL Server
# Run this from an external PowerShell window (not VSCode terminal)

Write-Host "🔌 Deploying Plugin System Schema..." -ForegroundColor Cyan

$scriptPath = Join-Path $PSScriptRoot "plugin-system-schema.sql"
$server = "RAMONPC\SQLEXPRESS"
$database = "FieldServiceDB"

# Check if sqlcmd is available
if (!(Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    Write-Host "❌ sqlcmd not found. Please install SQL Server Command Line Utilities." -ForegroundColor Red
    Write-Host "Download from: https://aka.ms/sqlpackage-windows" -ForegroundColor Yellow
    exit 1
}

# Execute the schema script
Write-Host "📊 Executing schema script on $server/$database..." -ForegroundColor Yellow
sqlcmd -S "$server" -d "$database" -E -i "$scriptPath"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Plugin system schema deployed successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Schema deployment failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    exit $LASTEXITCODE
}
