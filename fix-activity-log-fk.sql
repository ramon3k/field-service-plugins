-- Fix ActivityLog foreign key constraint to allow public submissions
USE FieldServiceDB;
GO

-- Drop the index first
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_UserID')
BEGIN
    DROP INDEX IX_ActivityLog_UserID ON ActivityLog;
    PRINT 'Dropped index IX_ActivityLog_UserID';
END
GO

-- Drop the foreign key constraint
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__ActivityL__UserI__31B762FC')
BEGIN
    ALTER TABLE ActivityLog DROP CONSTRAINT FK__ActivityL__UserI__31B762FC;
    PRINT 'Dropped foreign key constraint';
END
GO

-- Make UserID nullable
ALTER TABLE ActivityLog
ALTER COLUMN UserID VARCHAR(50) NULL;
PRINT 'Made UserID nullable';
GO

-- Recreate the index
CREATE NONCLUSTERED INDEX IX_ActivityLog_UserID ON ActivityLog(UserID);
PRINT 'Recreated index';
GO

-- Add back a foreign key with NO ACTION (allows NULL)
ALTER TABLE ActivityLog
ADD CONSTRAINT FK_ActivityLog_Users
FOREIGN KEY (UserID) REFERENCES Users(ID)
ON DELETE NO ACTION;
PRINT 'Added foreign key constraint with NULL support';
GO

PRINT 'ActivityLog fixed - public submissions will now work';
