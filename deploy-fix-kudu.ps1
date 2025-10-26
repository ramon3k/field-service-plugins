# Deploy the fixed api.cjs file to Azure via Kudu API
# This bypasses the zip deployment that keeps failing

$appName = "field-service-api"
$resourceGroup = "customer-portal_group"

Write-Host "`n🚀 Deploying fixed api.cjs via Kudu API..." -ForegroundColor Cyan

# Get publishing credentials
Write-Host "Getting deployment credentials..." -ForegroundColor Gray
$creds = az webapp deployment list-publishing-credentials --name $appName --resource-group $resourceGroup --query "{username:publishingUserName, password:publishingPassword}" -o json | ConvertFrom-Json

if (!$creds) {
    Write-Host "❌ Failed to get credentials" -ForegroundColor Red
    exit 1
}

# Read the fixed api.cjs file
$apiFilePath = "server\api.cjs"
if (!(Test-Path $apiFilePath)) {
    Write-Host "❌ File not found: $apiFilePath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found file: $apiFilePath" -ForegroundColor Green
$fileContent = Get-Content $apiFilePath -Raw

# Create credentials for Basic Auth
$pair = "$($creds.username):$($creds.password)"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [System.Convert]::ToBase64String($bytes)
$basicAuth = "Basic $base64"

# Upload via Kudu API
$kuduUrl = "https://$appName.scm.azurewebsites.net/api/vfs/site/wwwroot/api.cjs"
Write-Host "Uploading to: $kuduUrl" -ForegroundColor Gray

try {
    $headers = @{
        "Authorization" = $basicAuth
        "If-Match" = "*"
    }
    
    Invoke-RestMethod -Uri $kuduUrl -Method PUT -Headers $headers -Body $fileContent -ContentType "application/octet-stream"
    Write-Host "✅ File uploaded successfully!" -ForegroundColor Green
    
    Write-Host "`n⏳ Restarting app service..." -ForegroundColor Yellow
    az webapp restart --name $appName --resource-group $resourceGroup | Out-Null
    
    Write-Host "✅ App restarted!" -ForegroundColor Green
    Write-Host "`n🎉 Deployment complete! Try uploading an attachment now." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Alternative: Use VS Code Azure extension" -ForegroundColor Yellow
    Write-Host "   1. Install 'Azure App Service' extension" -ForegroundColor Gray
    Write-Host "   2. Right-click server/api.cjs" -ForegroundColor Gray
    Write-Host "   3. Deploy to Web App" -ForegroundColor Gray
}
