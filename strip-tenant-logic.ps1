# Strip all tenant-related code from frontend components
# This script removes tenant_session checks and X-Tenant-Code/X-Company-Code headers

$files = @(
    "src\components\UserManagementPage.tsx",
    "src\components\ServiceRequestsPage.tsx",
    "src\components\Nav.tsx",
    "src\components\ActivityLogPage.tsx",
    "src\components\RecentActivityWidget.tsx",
    "src\App.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Remove tenant_session localStorage checks and header additions
        $content = $content -replace "const tenantSession = localStorage\.getItem\('tenant_session'\);?\s*", ""
        $content = $content -replace "if \(tenantSession\) \{\s*const session = JSON\.parse\(tenantSession\);?\s*headers\['X-Tenant-Code'\] = session\.tenantCode;?\s*headers\['X-Company-Code'\] = session\.tenantCode;?\s*\}\s*", ""
        $content = $content -replace "headers\['X-Tenant-Code'\] = session\.tenantCode;?\s*", ""
        $content = $content -replace "headers\['X-Company-Code'\] = session\.tenantCode;?\s*", ""
        
        # Remove localStorage.removeItem('tenant_session')
        $content = $content -replace "localStorage\.removeItem\('tenant_session'\);?\s*(\/\/ CRITICAL.*?)?\s*", ""
        
        Set-Content $file $content -NoNewline
        Write-Host "✅ Cleaned: $file"
    }
}

Write-Host "`n✅ All tenant logic removed from components"
