# Field Service Management System - Configuration Wizard
# Interactive setup for customizing your installation

param(
    [switch]$Automated,
    [string]$ConfigFile = "config.json"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Error { Write-Host $args -ForegroundColor Red }

Clear-Host

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Field Service Management System" -ForegroundColor Cyan
Write-Host " Configuration Wizard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

# Default configuration
$config = @{
    CompanyName = "Your Company Name"
    CompanyCode = "COMPANY"
    DatabaseServer = "localhost\SQLEXPRESS"
    DatabaseName = "FieldServiceDB"
    DatabaseAuth = "Windows"  # Windows or SQL
    DatabaseUser = ""
    DatabasePassword = ""
    ApiPort = 5000
    FrontendPort = 5173
    AdminUsername = "admin"
    AdminPassword = "admin123"
    AdminEmail = "admin@company.com"
    AdminFullName = "System Administrator"
    BackupEnabled = $true
    BackupTime = "02:00"
    BackupRetentionDays = 30
    ServiceRequestsEnabled = $true
    PublicSubmissionUrl = "http://localhost:5000/service-request.html"
    EnableAutoUpdates = $false
}

# Check if config file already exists
if (Test-Path (Join-Path $RootDir $ConfigFile)) {
    Write-Warning "Existing configuration found: $ConfigFile"
    $loadExisting = Read-Host "Load existing configuration? (Y/N)"
    if ($loadExisting -eq "Y" -or $loadExisting -eq "y") {
        try {
            $existingConfig = Get-Content (Join-Path $RootDir $ConfigFile) | ConvertFrom-Json
            # Merge with defaults
            $existingConfig.PSObject.Properties | ForEach-Object {
                $config[$_.Name] = $_.Value
            }
            Write-Success "Loaded existing configuration"
        }
        catch {
            Write-Warning "Could not load existing config, using defaults"
        }
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host " Company Information"
Write-Host "========================================"
Write-Host ""

$input = Read-Host "Company Name [$($config.CompanyName)]"
if ($input) { $config.CompanyName = $input }

# Auto-suggest Company Code from Company Name
$suggestedCode = ($config.CompanyName -replace '[^a-zA-Z0-9]', '').ToUpper().Substring(0, [Math]::Min(8, ($config.CompanyName -replace '[^a-zA-Z0-9]', '').Length))
Write-Host ""
Write-Info "Company Code is used for multi-tenant data isolation (vendor separation)"
Write-Info "Suggested: $suggestedCode (max 8 characters, letters/numbers only)"
$input = Read-Host "Company Code [$suggestedCode]"
if ($input) { 
    $config.CompanyCode = ($input -replace '[^a-zA-Z0-9]', '').ToUpper().Substring(0, [Math]::Min(8, $input.Length))
} else {
    $config.CompanyCode = $suggestedCode
}

Write-Host ""
Write-Host "========================================"
Write-Host " Database Configuration"
Write-Host "========================================"
Write-Host ""

$input = Read-Host "Database Server [$($config.DatabaseServer)]"
if ($input) { $config.DatabaseServer = $input }

$input = Read-Host "Database Name [$($config.DatabaseName)]"
if ($input) { $config.DatabaseName = $input }

Write-Host ""
Write-Host "Authentication Methods:"
Write-Host "1. Windows Authentication (recommended)"
Write-Host "2. SQL Server Authentication"
$authChoice = Read-Host "Select authentication method (1/2) [1]"
if ($authChoice -eq "2") {
    $config.DatabaseAuth = "SQL"
    $config.DatabaseUser = Read-Host "SQL Server Username"
    $securePassword = Read-Host "SQL Server Password" -AsSecureString
    $config.DatabasePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    )
}
else {
    $config.DatabaseAuth = "Windows"
    $config.DatabaseUser = ""
    $config.DatabasePassword = ""
}

Write-Host ""
Write-Host "========================================"
Write-Host " Application Ports"
Write-Host "========================================"
Write-Host ""

$input = Read-Host "API Server Port [$($config.ApiPort)]"
if ($input) { $config.ApiPort = [int]$input }

$input = Read-Host "Frontend Dev Port [$($config.FrontendPort)]"
if ($input) { $config.FrontendPort = [int]$input }

Write-Host ""
Write-Host "========================================"
Write-Host " Administrator Account"
Write-Host "========================================"
Write-Host ""
Write-Warning "This will be your login to access the system"
Write-Host ""

$input = Read-Host "Admin Username [$($config.AdminUsername)]"
if ($input) { $config.AdminUsername = $input }

$input = Read-Host "Admin Full Name [$($config.AdminFullName)]"
if ($input) { $config.AdminFullName = $input }

$input = Read-Host "Admin Email [$($config.AdminEmail)]"
if ($input) { $config.AdminEmail = $input }

Write-Host ""
Write-Warning "Set a strong password for the admin account"
$securePassword = Read-Host "Admin Password" -AsSecureString
$config.AdminPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
)

Write-Host ""
Write-Host "========================================"
Write-Host " Backup Configuration"
Write-Host "========================================"
Write-Host ""

$enableBackup = Read-Host "Enable automatic daily backups? (Y/N) [Y]"
$config.BackupEnabled = ($enableBackup -ne "N" -and $enableBackup -ne "n")

if ($config.BackupEnabled) {
    $input = Read-Host "Backup Time (24-hour format, e.g., 02:00) [$($config.BackupTime)]"
    if ($input) { $config.BackupTime = $input }
    
    $input = Read-Host "Keep backups for how many days? [$($config.BackupRetentionDays)]"
    if ($input) { $config.BackupRetentionDays = [int]$input }
}

Write-Host ""
Write-Host "========================================"
Write-Host " Service Requests (Public Submission)"
Write-Host "========================================"
Write-Host ""

$enableSR = Read-Host "Enable public service request submissions? (Y/N) [Y]"
$config.ServiceRequestsEnabled = ($enableSR -ne "N" -and $enableSR -ne "n")

if ($config.ServiceRequestsEnabled) {
    Write-Info "Public submission URL will be: http://localhost:$($config.ApiPort)/service-request.html"
    Write-Info "You can share this URL with customers for service requests"
}

Write-Host ""
Write-Host "========================================"
Write-Host " Review Configuration"
Write-Host "========================================"
Write-Host ""

Write-Host "Company: " -NoNewline
Write-Info $config.CompanyName

Write-Host "Database: " -NoNewline
Write-Info "$($config.DatabaseServer) / $($config.DatabaseName)"

Write-Host "Auth Method: " -NoNewline
Write-Info $config.DatabaseAuth

Write-Host "API Port: " -NoNewline
Write-Info $config.ApiPort

Write-Host "Admin User: " -NoNewline
Write-Info $config.AdminUsername

Write-Host "Backups: " -NoNewline
if ($config.BackupEnabled) {
    Write-Info "Enabled (Daily at $($config.BackupTime), keep $($config.BackupRetentionDays) days)"
}
else {
    Write-Info "Disabled"
}

Write-Host "Service Requests: " -NoNewline
if ($config.ServiceRequestsEnabled) {
    Write-Success "Enabled"
}
else {
    Write-Warning "Disabled"
}

Write-Host ""
$confirm = Read-Host "Save this configuration? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Warning "Configuration cancelled"
    exit 1
}

# Save configuration to JSON file
try {
    $configPath = Join-Path $RootDir $ConfigFile
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
    Write-Success "Configuration saved to: $ConfigFile"
}
catch {
    Write-Error "Failed to save configuration: $_"
    exit 1
}

# Create connection string based on auth method
if ($config.DatabaseAuth -eq "SQL") {
    $connectionString = "server=$($config.DatabaseServer);Database=$($config.DatabaseName);User Id=$($config.DatabaseUser);Password=$($config.DatabasePassword);Trusted_Connection=No;Driver={ODBC Driver 17 for SQL Server};"
}
else {
    $connectionString = "server=$($config.DatabaseServer);Database=$($config.DatabaseName);Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server};"
}

# Save connection string to environment file
Write-Host ""
Write-Info "Creating environment configuration..."

$envContent = @"
# Field Service Management System - Environment Configuration
# Generated by Configuration Wizard on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Database Configuration
DB_CONNECTION_STRING=$connectionString
DB_SERVER=$($config.DatabaseServer)
DB_NAME=$($config.DatabaseName)
DB_AUTH=$($config.DatabaseAuth)

# Application Configuration
COMPANY_NAME=$($config.CompanyName)
API_PORT=$($config.ApiPort)
FRONTEND_PORT=$($config.FrontendPort)

# Security
JWT_SECRET=$(New-Guid)
SESSION_SECRET=$(New-Guid)

# Features
SERVICE_REQUESTS_ENABLED=$($config.ServiceRequestsEnabled.ToString().ToLower())
PUBLIC_SUBMISSION_URL=$($config.PublicSubmissionUrl)

# Backup Configuration
BACKUP_ENABLED=$($config.BackupEnabled.ToString().ToLower())
BACKUP_TIME=$($config.BackupTime)
BACKUP_RETENTION_DAYS=$($config.BackupRetentionDays)

# Environment
NODE_ENV=production
"@

try {
    $envPath = Join-Path $RootDir "server\.env"
    $envContent | Set-Content $envPath
    Write-Success "Environment file created: server\.env"
}
catch {
    Write-Warning "Could not create .env file: $_"
}

# Create admin user SQL script
Write-Host ""
Write-Info "Generating admin user creation script..."

# Encode password as Base64 (matching login verification format)
$passwordBytes = [System.Text.Encoding]::UTF8.GetBytes($config.AdminPassword)
$passwordHash = [System.Convert]::ToBase64String($passwordBytes)

$adminUserSQL = @"
-- Create Admin User and Company
-- Generated by Configuration Wizard

USE [$($config.DatabaseName)];
GO

-- First, ensure the company exists in Companies table
IF NOT EXISTS (SELECT * FROM Companies WHERE CompanyCode = '$($config.CompanyCode)')
BEGIN
    INSERT INTO Companies (CompanyCode, CompanyName, DisplayName, ContactEmail, IsActive, AllowServiceRequests, CreatedAt)
    VALUES (
        '$($config.CompanyCode)',
        '$($config.CompanyName)',
        '$($config.CompanyName)',
        '$($config.AdminEmail)',
        1,
        1,
        GETDATE()
    );
    PRINT 'Company record created successfully for: $($config.CompanyCode)';
END
ELSE
BEGIN
    -- Update existing company
    UPDATE Companies
    SET CompanyName = '$($config.CompanyName)',
        DisplayName = '$($config.CompanyName)',
        ContactEmail = '$($config.AdminEmail)',
        IsActive = 1,
        UpdatedAt = GETDATE()
    WHERE CompanyCode = '$($config.CompanyCode)';
    PRINT 'Company record updated for: $($config.CompanyCode)';
END
GO

-- Check if admin user exists
IF NOT EXISTS (SELECT * FROM Users WHERE Username = '$($config.AdminUsername)')
BEGIN
    INSERT INTO Users (ID, Username, Email, FullName, Role, PasswordHash, IsActive, CreatedAt, CompanyCode)
    VALUES (
        'admin_001',
        '$($config.AdminUsername)',
        '$($config.AdminEmail)',
        '$($config.AdminFullName)',
        'Admin',
        '$passwordHash',
        1,
        GETDATE(),
        '$($config.CompanyCode)'
    );
    PRINT 'Admin user created successfully';
END
ELSE
BEGIN
    -- Update existing admin user
    UPDATE Users
    SET Email = '$($config.AdminEmail)',
        FullName = '$($config.AdminFullName)',
        PasswordHash = '$passwordHash',
        IsActive = 1,
        CompanyCode = '$($config.CompanyCode)'
    WHERE Username = '$($config.AdminUsername)';
    PRINT 'Admin user updated successfully';
END
GO

-- Also create system user for automated tasks
IF NOT EXISTS (SELECT * FROM Users WHERE ID = 'system_001')
BEGIN
    INSERT INTO Users (ID, Username, Email, FullName, Role, PasswordHash, IsActive, CreatedAt, CompanyCode)
    VALUES (
        'system_001',
        'system',
        'system@$($config.CompanyName).com',
        'System',
        'Admin',
        '$passwordHash',
        1,
        GETDATE(),
        '$($config.CompanyCode)'
    );
    PRINT 'System user created successfully';
END
GO
"@

try {
    $adminUserPath = Join-Path $RootDir "database\create-admin-user.sql"
    $adminUserSQL | Set-Content $adminUserPath
    Write-Success "Admin user script created: database\create-admin-user.sql"
}
catch {
    Write-Warning "Could not create admin user script: $_"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Success "Configuration files created:"
Write-Host "  • config.json - Master configuration"
Write-Host "  • server\.env - Environment variables"
Write-Host "  • database\create-admin-user.sql - Admin account"
Write-Host ""

Write-Info "Next steps:"
Write-Host "  1. Run SETUP.bat to install the application"
Write-Host "  2. Access the system at: http://localhost:$($config.ApiPort)"
Write-Host "  3. Login with: $($config.AdminUsername) / [your password]"
Write-Host ""

if ($config.ServiceRequestsEnabled) {
    Write-Info "Public service request URL:"
    Write-Host "  http://localhost:$($config.ApiPort)/service-request.html"
    Write-Host ""
}

Write-Warning "IMPORTANT SECURITY NOTES:"
Write-Host "  • Change your admin password after first login"
Write-Host "  • The config.json contains sensitive information"
Write-Host "  • Do not commit .env files to version control"
Write-Host "  • Configure Windows Firewall for production use"
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
