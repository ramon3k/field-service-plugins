Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('field-service-plugins-v2.1.5.zip')
$entries = $zip.Entries.FullName

Write-Host "Checking essential installation files:"
Write-Host ""
Write-Host "Main setup files:"
$setupFiles = @('SETUP.bat', 'CONFIGURE.bat', 'UNINSTALL.bat', 'PRE-FLIGHT-CHECK.bat', 'RESTART-API.bat')
foreach ($file in $setupFiles) {
    $found = ($entries | Where-Object { $_ -eq $file }).Count
    Write-Host "  $file : $(if ($found) { 'YES' } else { 'MISSING' })"
}

Write-Host ""
Write-Host "Config files:"
$configFiles = @('package.json', 'vite.config.ts', 'tsconfig.json', '.env.example')
foreach ($file in $configFiles) {
    $found = ($entries | Where-Object { $_ -eq $file }).Count
    Write-Host "  $file : $(if ($found) { 'YES' } else { 'MISSING' })"
}

Write-Host ""
Write-Host "Documentation:"
$docFiles = @('README.md', 'FRESH-INSTALL-GUIDE.md', 'LOCAL-INSTALL.md', 'PLUGIN-DEVELOPER-GUIDE.md')
foreach ($file in $docFiles) {
    $found = ($entries | Where-Object { $_ -eq $file }).Count
    Write-Host "  $file : $(if ($found) { 'YES' } else { 'MISSING' })"
}

Write-Host ""
Write-Host "Folder counts:"
Write-Host "  scripts/ folder: $(($entries | Where-Object { $_ -match '^scripts/' }).Count) files"
Write-Host "  server/ folder: $(($entries | Where-Object { $_ -match '^server/' }).Count) files"
Write-Host "  src/ folder: $(($entries | Where-Object { $_ -match '^src/' }).Count) files"
Write-Host "  database/ folder: $(($entries | Where-Object { $_ -match '^database/' }).Count) files"

Write-Host ""
Write-Host "Total files: $($entries.Count)"
Write-Host "ZIP size: $([math]::Round((Get-Item 'field-service-plugins-v2.1.5.zip').Length/1MB, 2)) MB"

$zip.Dispose()
