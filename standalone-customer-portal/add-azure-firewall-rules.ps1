# Add Azure App Service Outbound IPs to Windows Firewall for SQL Server
# Run this script as Administrator on your local machine (24.32.74.177)

$azureIPs = @(
    "20.109.200.146",
    "20.109.200.203",
    "20.109.200.216",
    "20.109.200.239",
    "20.109.200.241",
    "20.109.201.7",
    "20.118.11.166",
    "20.118.12.193",
    "20.118.12.67",
    "20.118.13.255",
    "20.118.14.25",
    "20.118.14.8",
    "40.122.200.161",
    "40.122.200.61",
    "40.122.206.112",
    "40.77.101.182",
    "40.77.101.75",
    "40.77.19.89",
    "40.77.22.57",
    "40.77.98.66",
    "40.78.145.43",
    "52.173.149.254"
)

Write-Host "`n🔥 Adding Azure IPs to Windows Firewall..." -ForegroundColor Cyan

# Get existing firewall rule for SQL Server
$existingRule = Get-NetFirewallRule -DisplayName "SQL Server Port 1433 - Azure Customer Portal" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "✅ Firewall rule exists, updating..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "SQL Server Port 1433 - Azure Customer Portal"
}

# Create firewall rule for all Azure IPs
$ipList = $azureIPs -join ","
New-NetFirewallRule `
    -DisplayName "SQL Server Port 1433 - Azure Customer Portal" `
    -Direction Inbound `
    -LocalPort 1433 `
    -Protocol TCP `
    -Action Allow `
    -RemoteAddress $ipList `
    -Profile Any

Write-Host "`n✅ Firewall rules added successfully!" -ForegroundColor Green
Write-Host "`nAdded access for $($azureIPs.Count) Azure IP addresses" -ForegroundColor White
Write-Host "`nTesting SQL Server connectivity..." -ForegroundColor Cyan

# Test if SQL Server is listening on port 1433
$tcpTest = Test-NetConnection -ComputerName localhost -Port 1433 -WarningAction SilentlyContinue

if ($tcpTest.TcpTestSucceeded) {
    Write-Host "✅ SQL Server is listening on port 1433" -ForegroundColor Green
} else {
    Write-Host "❌ SQL Server is NOT listening on port 1433" -ForegroundColor Red
    Write-Host "   Check if SQL Server is running and TCP/IP is enabled" -ForegroundColor Yellow
}

Write-Host "`n📝 Firewall Rules:" -ForegroundColor Cyan
Get-NetFirewallRule -DisplayName "SQL Server*" | Select-Object DisplayName, Enabled, Direction | Format-Table

Write-Host "`n✅ Done! Azure can now connect to your SQL Server`n" -ForegroundColor Green
