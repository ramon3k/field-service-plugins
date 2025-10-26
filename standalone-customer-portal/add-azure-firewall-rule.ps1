# Add Azure IP addresses to Windows Firewall for SQL Server access
# Run this as Administrator!
# UPDATED with CORRECT IPs from possibleOutboundIpAddresses

$azureIPs = @('20.109.200.146', '20.109.200.203', '20.109.200.216', '20.109.200.239', '20.109.200.241', '20.109.201.7', '20.118.11.166', '20.118.12.193', '20.118.12.67', '20.118.13.255', '20.118.14.25', '20.118.14.8', '40.122.200.161', '40.122.200.61', '40.122.206.112', '40.77.101.182', '40.77.101.75', '40.77.19.89', '40.77.22.57', '40.77.98.66', '40.78.145.43', '52.173.149.254')

Write-Host ""
Write-Host "Adding Azure App Service IPs to Windows Firewall..." -ForegroundColor Cyan
Write-Host "This will allow your Azure customer portal to connect to SQL Server" -ForegroundColor Yellow
Write-Host ""
Write-Host "Adding $($azureIPs.Count) IP addresses..." -ForegroundColor White
Write-Host ""

try {
    Remove-NetFirewallRule -DisplayName "Azure App Service - Customer Portal" -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Azure App Service - Customer Portal" -Description "Allow Azure App Service to connect to SQL Server for customer portal" -Direction Inbound -Protocol TCP -LocalPort 1433 -RemoteAddress $azureIPs -Action Allow -Enabled True -Profile Any -ErrorAction Stop
    
    Write-Host ""
    Write-Host "SUCCESS! Firewall rule created" -ForegroundColor Green
    Write-Host ""
    Write-Host "Firewall rule details:" -ForegroundColor Cyan
    Write-Host "   Name: Azure App Service - Customer Portal" -ForegroundColor White
    Write-Host "   Port: 1433 (SQL Server)" -ForegroundColor White
    Write-Host "   IPs: $($azureIPs.Count) Azure outbound IPs" -ForegroundColor White
    Write-Host ""
    Write-Host "Your Azure portal can now connect to SQL Server!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Test submitting a service request at:" -ForegroundColor Yellow
    Write-Host "   https://customer-portal-linux.azurewebsites.net" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you're running PowerShell as Administrator!" -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to close"
