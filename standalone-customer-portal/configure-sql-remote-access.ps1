# SQL Server Remote Access Configuration Script
# Run this on your SQL Server machine as Administrator

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "SQL Server Remote Access Configuration" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Enable TCP/IP Protocol
Write-Host "Step 1: Enabling TCP/IP Protocol..." -ForegroundColor Yellow
Write-Host "You need to do this manually:" -ForegroundColor Gray
Write-Host "1. Open 'SQL Server Configuration Manager'" -ForegroundColor White
Write-Host "2. Expand 'SQL Server Network Configuration'" -ForegroundColor White
Write-Host "3. Click 'Protocols for SQLEXPRESS'" -ForegroundColor White
Write-Host "4. Right-click 'TCP/IP' → Enable" -ForegroundColor White
Write-Host "5. Double-click 'TCP/IP' → IP Addresses tab" -ForegroundColor White
Write-Host "6. Scroll to 'IPAll' section" -ForegroundColor White
Write-Host "7. Set 'TCP Port' to: 1433" -ForegroundColor White
Write-Host "8. Click OK" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter after you've completed Step 1"

# Step 2: Restart SQL Server
Write-Host ""
Write-Host "Step 2: Restarting SQL Server..." -ForegroundColor Yellow
try {
    Restart-Service -Name "MSSQL`$SQLEXPRESS" -Force
    Write-Host "✅ SQL Server restarted successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not restart SQL Server automatically" -ForegroundColor Yellow
    Write-Host "   Please restart it manually:" -ForegroundColor Gray
    Write-Host "   Services → SQL Server (SQLEXPRESS) → Restart" -ForegroundColor White
}
Write-Host ""

# Step 3: Enable SQL Server Authentication
Write-Host "Step 3: Enable SQL Server Authentication..." -ForegroundColor Yellow
Write-Host "You need to do this manually:" -ForegroundColor Gray
Write-Host "1. Open SQL Server Management Studio (SSMS)" -ForegroundColor White
Write-Host "2. Connect to localhost\SQLEXPRESS" -ForegroundColor White
Write-Host "3. Right-click server name → Properties" -ForegroundColor White
Write-Host "4. Go to 'Security' page" -ForegroundColor White
Write-Host "5. Select 'SQL Server and Windows Authentication mode'" -ForegroundColor White
Write-Host "6. Click OK" -ForegroundColor White
Write-Host "7. Restart SQL Server again" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter after you've completed Step 3"

# Step 4: Add Firewall Rule
Write-Host ""
Write-Host "Step 4: Adding Windows Firewall Rule..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "SQL Server Port 1433" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 1433 `
        -Action Allow `
        -Enabled True
    Write-Host "✅ Firewall rule added successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Firewall rule might already exist or insufficient permissions" -ForegroundColor Yellow
    Write-Host "   To add manually:" -ForegroundColor Gray
    Write-Host "   Windows Firewall → Inbound Rules → New Rule" -ForegroundColor White
    Write-Host "   Port: 1433, TCP, Allow connection" -ForegroundColor White
}
Write-Host ""

# Step 5: Test Local Connection
Write-Host "Step 5: Testing SQL Server is listening..." -ForegroundColor Yellow
$listening = Get-NetTCPConnection -LocalPort 1433 -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host "✅ SQL Server is listening on port 1433" -ForegroundColor Green
} else {
    Write-Host "❌ SQL Server is NOT listening on port 1433" -ForegroundColor Red
    Write-Host "   Go back to Step 1 and verify TCP/IP is enabled" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Display Connection Info
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "Configuration Summary" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Public IP: 24.32.74.177" -ForegroundColor Green
Write-Host ""
Write-Host "Use this in Azure Portal Configuration:" -ForegroundColor Yellow
Write-Host "  DB_SERVER = 24.32.74.177" -ForegroundColor White
Write-Host "  DB_NAME = FieldServiceDB" -ForegroundColor White
Write-Host "  DB_USER = portal_user" -ForegroundColor White
Write-Host "  DB_PASSWORD = (your password from setup-database-user.sql)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Your IP (24.32.74.177) might change if your modem reboots" -ForegroundColor Gray
Write-Host "  - Consider getting a static IP or using Dynamic DNS" -ForegroundColor Gray
Write-Host "  - Make sure your router forwards port 1433 to this computer" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run setup-database-user.sql in SSMS to create portal_user" -ForegroundColor White
Write-Host "2. Add DB_SERVER, DB_USER, DB_PASSWORD to Azure Portal" -ForegroundColor White
Write-Host "3. Test connection from Azure" -ForegroundColor White
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
