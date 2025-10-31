# Clean up repository - remove development and test files

Write-Host "Removing development and test files from git..." -ForegroundColor Yellow

# Remove all .zip files except time-clock-plugin.zip
git rm --cached api-clean-deploy.zip 2>$null
git rm --cached api-deploy.zip 2>$null
git rm --cached api-logs-164614.zip 2>$null
git rm --cached api-logs.zip 2>$null
git rm --cached api-server-only.zip 2>$null
git rm --cached azure-logs.zip 2>$null
git rm --cached deploy-logs.zip 2>$null
git rm --cached deploy.zip 2>$null
git rm --cached latest-logs.zip 2>$null
git rm --cached server-only.zip 2>$null
git rm --cached time-clock-plugin-package.zip 2>$null
git rm --cached vamp-plugin.zip 2>$null

# Remove standalone customer portal zips
git rm --cached standalone-customer-portal/azure-deploy.zip 2>$null
git rm --cached standalone-customer-portal/azure-logs-latest.zip 2>$null
git rm --cached standalone-customer-portal/azure-logs.zip 2>$null
git rm --cached standalone-customer-portal/complete-deploy.zip 2>$null
git rm --cached standalone-customer-portal/customer-portal-deploy.zip 2>$null
git rm --cached standalone-customer-portal/deploy-clean.zip 2>$null
git rm --cached standalone-customer-portal/deploy-no-modules.zip 2>$null
git rm --cached standalone-customer-portal/deploy.zip 2>$null
git rm --cached standalone-customer-portal/latest-logs.zip 2>$null
git rm --cached standalone-customer-portal/plesk-deployment.zip 2>$null
git rm --cached standalone-customer-portal/portal-deploy.zip 2>$null
git rm --cached standalone-customer-portal/portal-full-deploy.zip 2>$null
git rm --cached standalone-customer-portal/portal-logs.zip 2>$null

# Remove temp/test/demo files
git rm --cached temp-api-download.cjs 2>$null
git rm --cached temp-api-original.cjs 2>$null
git rm --cached temp-restore-api.cjs 2>$null
git rm --cached -r temp-extract 2>$null
git rm --cached test-demo-login.cjs 2>$null
git rm --cached test-from-client.ps1 2>$null
git rm --cached test-output.txt 2>$null
git rm --cached add-demo-users.cjs 2>$null
git rm --cached check-demo-passwords.cjs 2>$null
git rm --cached check-demo-users.cjs 2>$null
git rm --cached check-licenses.cjs 2>$null
git rm --cached check-ticket-format.cjs 2>$null
git rm --cached check-vendors-schema.cjs 2>$null
git rm --cached cleanup-all-demo-data.cjs 2>$null
git rm --cached cleanup-remaining-demo.cjs 2>$null
git rm --cached clear-demo-db.cjs 2>$null
git rm --cached compare-users.cjs 2>$null
git rm --cached create-demo-users-azure.cjs 2>$null
git rm --cached current-working-api.cjs 2>$null
git rm --cached deployed-api-check.cjs 2>$null
git rm --cached get-schema.cjs 2>$null
git rm --cached load-complete-demo-data.cjs 2>$null
git rm --cached load-demo-data.cjs 2>$null
git rm --cached verify-database-state.cjs 2>$null

# Remove fix/diagnose scripts
git rm --cached fix-activity-log-fk.sql 2>$null
git rm --cached fix-api-paths.ps1 2>$null
git rm --cached fix-passwords-cbgb.sql 2>$null
git rm --cached fix-passwords-dcpsp.sql 2>$null
git rm --cached fix-pool-references.cjs 2>$null
git rm --cached fix-tenant-refs.ps1 2>$null
git rm --cached diagnose-network.ps1 2>$null
git rm --cached diagnose-plugin-issue.sql 2>$null
git rm --cached strip-tenant-logic.ps1 2>$null
git rm --cached deploy-fix-kudu.ps1 2>$null

# Remove misc files
git rm --cached api.cjs 2>$null
git rm --cached api-package.json 2>$null
git rm --cached build-exclude.txt 2>$null
git rm --cached "fail log.txt" 2>$null
git rm --cached schema-check.txt 2>$null
git rm --cached query 2>$null
git rm --cached tsconfig.tsbuildinfo 2>$null
git rm --cached SETUP.bat.backup 2>$null
git rm --cached config.json 2>$null
git rm --cached change-company-code.sql 2>$null
git rm --cached install-timeclock-for-cbgb.sql 2>$null

# Remove database test/demo/fix files
git rm --cached database/check-plugin-tables.sql 2>$null
git rm --cached database/create-comprehensive-demo-data.sql 2>$null
git rm --cached database/create-demo-tickets.sql 2>$null
git rm --cached database/fix-globalplugins-schema.sql 2>$null
git rm --cached database/fix-schema-for-api-minimal.sql 2>$null
git rm --cached database/fix-schema.sql 2>$null
git rm --cached database/load-demo-data-final.sql 2>$null
git rm --cached database/load-demo-data-simple.sql 2>$null
git rm --cached database/populate-demo-data.sql 2>$null
git rm --cached database/setup-demo-database.sql 2>$null
git rm --cached database/test-azure-db.cjs 2>$null
git rm --cached database/test-customer-portal.sql 2>$null

# Remove scripts check files
git rm --cached scripts/check-attachments-table.bat 2>$null

# Remove demo guide
git rm --cached docs/archive/DEMO-DATABASE-GUIDE.md 2>$null

Write-Host "Done! Files removed from git tracking." -ForegroundColor Green
Write-Host "Run 'git status' to see changes." -ForegroundColor Cyan
