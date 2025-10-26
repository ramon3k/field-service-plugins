-- Add vendor compliance tracking fields to existing Vendors table
-- This separates vendor compliance from software licenses

-- Add State License Compliance fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'StateLicenseNumber')
BEGIN
  ALTER TABLE Vendors ADD StateLicenseNumber NVARCHAR(200);
  PRINT 'Added StateLicenseNumber to Vendors table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'StateLicenseExpiration')
BEGIN
  ALTER TABLE Vendors ADD StateLicenseExpiration DATE;
  PRINT 'Added StateLicenseExpiration to Vendors table';
END

-- Add Insurance Compliance fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'COIProvider')
BEGIN
  ALTER TABLE Vendors ADD COIProvider NVARCHAR(400);
  PRINT 'Added COIProvider to Vendors table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'COIPolicyNumber')
BEGIN
  ALTER TABLE Vendors ADD COIPolicyNumber NVARCHAR(200);
  PRINT 'Added COIPolicyNumber to Vendors table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'COIExpiration')
BEGIN
  ALTER TABLE Vendors ADD COIExpiration DATE;
  PRINT 'Added COIExpiration to Vendors table';
END

-- Add Additional fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'Certifications')
BEGIN
  ALTER TABLE Vendors ADD Certifications NVARCHAR(MAX);
  PRINT 'Added Certifications to Vendors table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'VendorStatus')
BEGIN
  ALTER TABLE Vendors ADD VendorStatus NVARCHAR(50) DEFAULT 'Active';
  PRINT 'Added VendorStatus to Vendors table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'ComplianceNotes')
BEGIN
  ALTER TABLE Vendors ADD ComplianceNotes NVARCHAR(MAX);
  PRINT 'Added ComplianceNotes to Vendors table';
END

GO

-- Remove vendor compliance fields from Licenses table (they belong in Vendors)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Licenses') AND name = 'StateLicenseNumber')
BEGIN
  ALTER TABLE Licenses DROP COLUMN StateLicenseNumber;
  PRINT 'Removed StateLicenseNumber from Licenses table';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Licenses') AND name = 'StateLicenseExpiration')
BEGIN
  ALTER TABLE Licenses DROP COLUMN StateLicenseExpiration;
  PRINT 'Removed StateLicenseExpiration from Licenses table';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Licenses') AND name = 'COIExpiration')
BEGIN
  ALTER TABLE Licenses DROP COLUMN COIExpiration;
  PRINT 'Removed COIExpiration from Licenses table';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Licenses') AND name = 'COIProvider')
BEGIN
  ALTER TABLE Licenses DROP COLUMN COIProvider;
  PRINT 'Removed COIProvider from Licenses table';
END
GO

SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Vendors'
  AND COLUMN_NAME IN ('StateLicenseNumber', 'StateLicenseExpiration', 'COIProvider', 'COIPolicyNumber', 'COIExpiration', 'Certifications', 'VendorStatus', 'ComplianceNotes')
ORDER BY COLUMN_NAME;

PRINT '';
PRINT 'Vendor compliance migration completed successfully!';
