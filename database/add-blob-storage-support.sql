-- Azure Blob Storage Support Migration
-- Adds StorageType column to Attachments table

USE FieldServiceDB;
GO

PRINT 'Adding Azure Blob Storage support to Attachments table...';
PRINT '';

-- Add StorageType column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('Attachments') 
               AND name = 'StorageType')
BEGIN
    ALTER TABLE Attachments 
    ADD StorageType VARCHAR(20) DEFAULT 'local' NOT NULL;
    
    PRINT '✓ Added StorageType column to Attachments table';
    PRINT '  Default value: "local" for existing records';
END
ELSE
BEGIN
    PRINT '✓ StorageType column already exists';
END
GO

-- Update existing records to have 'local' storage type
UPDATE Attachments 
SET StorageType = 'local' 
WHERE StorageType IS NULL OR StorageType = '';
GO

PRINT '';
PRINT '✓ Migration complete!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Update server code to use storage manager (see docs/AZURE-BLOB-STORAGE-INTEGRATION.md)';
PRINT '2. Install dependencies: npm install @azure/storage-blob uuid';
PRINT '3. Configure Azure Blob Storage (see docs/AZURE-BLOB-STORAGE-SETUP.md)';
PRINT '4. Test file uploads';
GO
