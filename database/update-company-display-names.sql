-- Update company display names to fit better on printed tickets
USE FieldServiceDB;
GO

-- Show current values
SELECT CompanyCode, CompanyName, DisplayName 
FROM Companies;
GO

-- Update display names if needed (uncomment and customize as desired)

-- Option 1: Keep current names
-- No changes needed

-- Option 2: Shorter names for printing
-- UPDATE Companies SET DisplayName = 'DCPSP' WHERE CompanyCode = 'DCPSP';
-- UPDATE Companies SET DisplayName = 'JBI Security' WHERE CompanyCode = 'JBI';
-- UPDATE Companies SET DisplayName = 'Joey Bear Industries' WHERE CompanyCode = 'JOEY BEAR INDUSTRIES';

-- Option 3: Custom names for your preference
-- UPDATE Companies SET DisplayName = 'DCPSP Field Services' WHERE CompanyCode = 'DCPSP';
-- UPDATE Companies SET DisplayName = 'JBI Security Services' WHERE CompanyCode = 'JBI';

-- Show updated values
SELECT CompanyCode, CompanyName, DisplayName 
FROM Companies;
GO

PRINT '✅ Review the display names above. Uncomment and run the UPDATE statements you want.';
