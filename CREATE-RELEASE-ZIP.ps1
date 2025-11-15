# Quick Release ZIP Creator for v2.1.6
# Packages the current source code (like v2.1.5 did)

$version = "2.1.6"
$zipName = "field-service-plugins-v$version.zip"
$tempDir = "temp-release-$version"

Write-Host ""
Write-Host "Creating release package for v$version..." -ForegroundColor Cyan
Write-Host ""

# Remove old files if they exist
if (Test-Path $zipName) {
    Remove-Item $zipName -Force
    Write-Host "Removed old $zipName" -ForegroundColor Yellow
}

if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
    Write-Host "Removed old temp directory" -ForegroundColor Yellow
}

# Create temp directory
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Copying files..." -ForegroundColor Green

# Exclusions (same as v2.1.5)
$exclude = @(
    'node_modules',
    '.git',
    'temp-*',
    'release-*',
    '*.zip',
    '*.log',
    'logs',
    '*-logs',
    'api-logs',
    'azure-logs',
    'deploy-logs',
    'latest-logs',
    '.env',
    '.env.backup*',
    'setup-debug.log',
    'setup-test.log',
    'install.log',
    'schema-check.txt',
    'fail log.txt',
    'test-output.txt',
    'query',
    'standalone-customer-portal',
    'SQLEXPR_x64_ENU',
    'tsconfig.tsbuildinfo',
    '*.swp',
    '*.swo',
    '*.bak'
)

# Copy all files except exclusions
Get-ChildItem -Path . -Exclude $exclude | ForEach-Object {
    $destination = Join-Path $tempDir $_.Name
    if ($_.PSIsContainer) {
        # Skip excluded directories
        $skip = $false
        foreach ($ex in $exclude) {
            if ($_.Name -like $ex) {
                $skip = $true
                break
            }
        }
        if (-not $skip) {
            Copy-Item $_.FullName -Destination $destination -Recurse -Force -Exclude $exclude
        }
    } else {
        Copy-Item $_.FullName -Destination $destination -Force
    }
}

# Remove node_modules from server if it was copied
if (Test-Path "$tempDir\server\node_modules") {
    Remove-Item "$tempDir\server\node_modules" -Recurse -Force
    Write-Host "Cleaned server\node_modules" -ForegroundColor Yellow
}

# Clean server/plugins - keep only time-clock
if (Test-Path "$tempDir\server\plugins") {
    Get-ChildItem "$tempDir\server\plugins" | Where-Object {
        $_.Name -ne 'time-clock-plugin.zip' -and $_.Name -ne '.gitkeep'
    } | Remove-Item -Recurse -Force
    Write-Host "Cleaned server\plugins (kept time-clock only)" -ForegroundColor Yellow
}

Write-Host "Files copied successfully" -ForegroundColor Green

# Create ZIP
Write-Host ""
Write-Host "Creating ZIP archive..." -ForegroundColor Cyan
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipName -CompressionLevel Optimal -Force

# Check result
if (Test-Path $zipName) {
    $zipFile = Get-Item $zipName
    $sizeMB = [math]::Round($zipFile.Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  Release package created successfully!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "File: $zipName" -ForegroundColor Cyan
    Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
    Write-Host ""
    
    if ($sizeMB -lt 2.5) {
        Write-Host "WARNING: Size seems small (expected ~2.95 MB)" -ForegroundColor Yellow
        Write-Host "v2.1.5 was 2.95 MB for reference" -ForegroundColor Yellow
    } elseif ($sizeMB -gt 3.5) {
        Write-Host "WARNING: Size seems large (expected ~2.95 MB)" -ForegroundColor Yellow
    } else {
        Write-Host "Size looks good!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://github.com/ramon3k/field-service-plugins/releases" -ForegroundColor White
    Write-Host "2. Click 'Draft a new release'" -ForegroundColor White
    Write-Host "3. Choose tag: v$version" -ForegroundColor White
    Write-Host "4. Upload: $zipName" -ForegroundColor White
    Write-Host "5. Publish release" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ERROR: Failed to create ZIP file" -ForegroundColor Red
}

# Cleanup temp directory
Write-Host "Cleaning up temp directory..." -ForegroundColor Yellow
Remove-Item $tempDir -Recurse -Force

Write-Host "Done!" -ForegroundColor Green
Write-Host ""
