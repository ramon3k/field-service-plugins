# Field Service Network Setup Script
# This script configures the application for network access with hostname "workzown"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Field Service Network Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some operations (like changing hostname) require Administrator privileges" -ForegroundColor Yellow
    Write-Host ""
}

# Get current hostname
$currentHostname = $env:COMPUTERNAME
Write-Host "Current hostname: $currentHostname" -ForegroundColor White

# Set desired hostname
$newHostname = "workzown"

# Ask user if they want to change the hostname
Write-Host ""
Write-Host "Do you want to change the computer hostname to '$newHostname'?" -ForegroundColor Yellow
Write-Host "Note: This requires a restart and Administrator privileges" -ForegroundColor Yellow
$changeHostname = Read-Host "Change hostname? (y/n)"

if ($changeHostname -eq 'y' -or $changeHostname -eq 'Y') {
    if ($isAdmin) {
        try {
            Write-Host "Changing hostname to $newHostname..." -ForegroundColor Green
            Rename-Computer -NewName $newHostname -Force
            Write-Host "Hostname will be changed to '$newHostname' after restart" -ForegroundColor Green
            $hostnameChanged = $true
        } catch {
            Write-Host "ERROR: Failed to change hostname: $_" -ForegroundColor Red
            $hostnameChanged = $false
        }
    } else {
        Write-Host "ERROR: Administrator privileges required to change hostname" -ForegroundColor Red
        Write-Host "Please run this script as Administrator" -ForegroundColor Red
        $hostnameChanged = $false
    }
} else {
    Write-Host "Skipping hostname change, using current hostname: $currentHostname" -ForegroundColor Yellow
    $newHostname = $currentHostname
    $hostnameChanged = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating Configuration Files" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Update .env file
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "Updating $envFile..." -ForegroundColor Green
    
    # Read the file
    $envContent = Get-Content $envFile -Raw
    
    # Backup original
    $backupFile = ".env.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $envFile $backupFile
    Write-Host "  Created backup: $backupFile" -ForegroundColor Gray
    
    # Update API URL to use hostname
    $envContent = $envContent -replace 'VITE_API_URL=http://127\.0\.0\.1:5000/api', "VITE_API_URL=http://${newHostname}:5000/api"
    $envContent = $envContent -replace 'VITE_API_URL=http://localhost:5000/api', "VITE_API_URL=http://${newHostname}:5000/api"
    
    # Write back
    Set-Content -Path $envFile -Value $envContent -NoNewline
    Write-Host "  Updated VITE_API_URL to http://${newHostname}:5000/api" -ForegroundColor Green
} else {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuring Windows Firewall" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($isAdmin) {
    # Add firewall rules for ports 5000 and 5173
    try {
        Write-Host "Adding firewall rule for API server (port 5000)..." -ForegroundColor Green
        New-NetFirewallRule -DisplayName "Field Service API Server" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
        Write-Host "  Firewall rule added for port 5000" -ForegroundColor Green
    } catch {
        Write-Host "  Firewall rule may already exist for port 5000" -ForegroundColor Yellow
    }
    
    try {
        Write-Host "Adding firewall rule for Dev Server (port 5173)..." -ForegroundColor Green
        New-NetFirewallRule -DisplayName "Field Service Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
        Write-Host "  Firewall rule added for port 5173" -ForegroundColor Green
    } catch {
        Write-Host "  Firewall rule may already exist for port 5173" -ForegroundColor Yellow
    }
} else {
    Write-Host "WARNING: Administrator privileges required to configure firewall" -ForegroundColor Yellow
    Write-Host "Please run the following commands as Administrator:" -ForegroundColor Yellow
    Write-Host '  New-NetFirewallRule -DisplayName "Field Service API Server" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow' -ForegroundColor Gray
    Write-Host '  New-NetFirewallRule -DisplayName "Field Service Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow' -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Network Information" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get IP addresses
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" }
Write-Host "Network IP Addresses:" -ForegroundColor White
foreach ($ip in $ipAddresses) {
    Write-Host "  Interface: $($ip.InterfaceAlias)" -ForegroundColor Gray
    Write-Host "  IP Address: $($ip.IPAddress)" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Access URLs for network users:" -ForegroundColor Yellow
Write-Host "  Using hostname: http://${newHostname}:5173" -ForegroundColor Green
foreach ($ip in $ipAddresses) {
    Write-Host "  Using IP:       http://$($ip.IPAddress):5173" -ForegroundColor Green
}

Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "  1. Start API server:  npm start" -ForegroundColor White
Write-Host "  2. Start frontend:    npm run dev" -ForegroundColor White
Write-Host ""

if ($hostnameChanged) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "RESTART REQUIRED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "The computer hostname has been changed." -ForegroundColor Yellow
    Write-Host "Please restart the computer for changes to take effect." -ForegroundColor Yellow
    Write-Host ""
    $restart = Read-Host "Restart now? (y/n)"
    if ($restart -eq 'y' -or $restart -eq 'Y') {
        Write-Host "Restarting in 10 seconds..." -ForegroundColor Yellow
        shutdown /r /t 10
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
