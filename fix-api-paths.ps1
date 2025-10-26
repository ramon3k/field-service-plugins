$files = @(
  "src\components\UserManagementPage.tsx",
  "src\components\ServiceRequestsPage.tsx",
  "src\components\Nav.tsx",
  "src\components\ActivityLogPage.tsx",
  "src\components\AttachmentUpload.tsx",
  "src\components\AttachmentList.tsx",
  "src\components\TicketEditModal.tsx",
  "src\components\PrintableServiceTicket.tsx",
  "src\components\RecentActivityWidget.tsx"
)

foreach ($file in $files) {
  $content = Get-Content $file -Raw
  $content = $content -replace '\$\{API_BASE_URL\}/api/', '${API_BASE_URL}/'
  Set-Content -Path $file -Value $content -NoNewline
  Write-Host "Fixed: $file"
}
Write-Host "`nDone! Removed /api prefix from all fetch calls."