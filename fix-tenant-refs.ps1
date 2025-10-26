# Fix remaining tenant references
$files = @(
    'src\components\ServiceRequestsPage.tsx',
    'src\components\Nav.tsx',
    'src\components\ActivityLogPage.tsx',
    'src\components\RecentActivityWidget.tsx'
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    # Remove if-blocks that reference tenantSession
    $content = $content -creplace '(?s)if\s*\(\s*tenantSession\s*\)\s*\{.*?\}', ''
    Set-Content $file $content -NoNewline
    Write-Host "Processed: $file"
}

Write-Host "Done!"
