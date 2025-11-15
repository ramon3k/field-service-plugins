-- Field Service Database Schema Update Script
-- Adds new features to existing installation
-- Safe to run multiple times (checks for existing objects)

USE FieldServiceDB;
GO

PRINT '========================================';
PRINT 'Starting Database Schema Update';
PRINT '========================================';
PRINT '';

-- ====================================
-- Add Service Requests Table
-- ====================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ServiceRequests')
BEGIN
    CREATE TABLE ServiceRequests (
        RequestID NVARCHAR(50) PRIMARY KEY,
        CustomerName NVARCHAR(200) NOT NULL,
        ContactEmail NVARCHAR(100) NOT NULL,
        ContactPhone NVARCHAR(20),
        SiteName NVARCHAR(200),
        Address NVARCHAR(500),
        IssueDescription NVARCHAR(MAX) NOT NULL,
        Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (Priority IN ('Low', 'Medium', 'High')),
        Status NVARCHAR(20) NOT NULL DEFAULT 'New' CHECK (Status IN ('New', 'Processed', 'Dismissed')),
        SubmittedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ProcessedBy NVARCHAR(100),
        ProcessedAt DATETIME2,
        ProcessedNote NVARCHAR(MAX),
        TicketID NVARCHAR(50),
        IPAddress NVARCHAR(50),
        UserAgent NVARCHAR(500)
    );
    
    CREATE INDEX IX_ServiceRequests_Status ON ServiceRequests(Status);
    CREATE INDEX IX_ServiceRequests_SubmittedAt ON ServiceRequests(SubmittedAt DESC);
    
    PRINT '[√] ServiceRequests table created';
END
ELSE
BEGIN
    PRINT '[√] ServiceRequests table already exists';
END
GO

-- ====================================
-- Add Attachments Table
-- ====================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Attachments')
BEGIN
    CREATE TABLE Attachments (
        AttachmentID NVARCHAR(50) PRIMARY KEY,
        TicketID NVARCHAR(50) NOT NULL,
        FileName NVARCHAR(255) NOT NULL,
        OriginalFileName NVARCHAR(255) NOT NULL,
        FileType NVARCHAR(100) NOT NULL,
        FileSize INT NOT NULL,
        FilePath NVARCHAR(500) NOT NULL,
        UploadedBy NVARCHAR(50) NOT NULL,
        UploadedAt DATETIME NOT NULL DEFAULT GETDATE(),
        Description NVARCHAR(500) NULL,
        CONSTRAINT FK_Attachments_Ticket FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID) ON DELETE CASCADE,
        CONSTRAINT FK_Attachments_User FOREIGN KEY (UploadedBy) REFERENCES Users(ID)
    );
    
    CREATE INDEX IX_Attachments_TicketID ON Attachments(TicketID);
    CREATE INDEX IX_Attachments_UploadedAt ON Attachments(UploadedAt DESC);
    
    PRINT '[√] Attachments table created';
END
ELSE
BEGIN
    PRINT '[√] Attachments table already exists';
END
GO

-- ====================================
-- Add UserTimezone column to ActivityLog
-- ====================================

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLog')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ActivityLog') AND name = 'UserTimezone')
    BEGIN
        ALTER TABLE ActivityLog ADD UserTimezone NVARCHAR(100);
        PRINT '[√] Added UserTimezone column to ActivityLog';
    END
    ELSE
    BEGIN
        PRINT '[√] UserTimezone column already exists in ActivityLog';
    END
END
GO

-- ====================================
-- Add Vendor column to Users table
-- ====================================

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Vendor')
    BEGIN
        ALTER TABLE Users ADD Vendor NVARCHAR(200) NULL;
        PRINT '[√] Added Vendor column to Users table';
    END
    ELSE
    BEGIN
        PRINT '[√] Vendor column already exists in Users table';
    END
END
GO

-- ====================================
-- Add LicenseIDs column to Tickets table
-- ====================================

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Tickets')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tickets') AND name = 'LicenseIDs')
    BEGIN
        ALTER TABLE Tickets ADD LicenseIDs NVARCHAR(MAX);
        PRINT '[√] Added LicenseIDs column to Tickets table';
    END
    ELSE
    BEGIN
        PRINT '[√] LicenseIDs column already exists in Tickets table';
    END
END
GO

-- ====================================
-- Update CoordinatorNotes table structure
-- ====================================

-- Check if CoordinatorNotes has the correct structure
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CoordinatorNotes')
BEGIN
    -- Check if NoteID column exists (new structure)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CoordinatorNotes') AND name = 'NoteID')
    BEGIN
        -- Old structure detected, need to recreate
        PRINT '[!] Updating CoordinatorNotes table structure...';
        
        -- Create temporary table with new structure
        CREATE TABLE CoordinatorNotes_New (
            NoteID NVARCHAR(50) PRIMARY KEY,
            TicketID NVARCHAR(50) NOT NULL,
            CoordinatorName NVARCHAR(100) NOT NULL,
            Note NVARCHAR(MAX) NOT NULL,
            Timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
            FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID) ON DELETE CASCADE
        );
        
        -- Copy existing data if any
        IF EXISTS (SELECT * FROM CoordinatorNotes)
        BEGIN
            INSERT INTO CoordinatorNotes_New (NoteID, TicketID, CoordinatorName, Note, Timestamp)
            SELECT 
                'note_' + CAST(ID AS NVARCHAR(50)) as NoteID,
                TicketID,
                ISNULL(CreatedBy, 'Unknown') as CoordinatorName,
                Note,
                ISNULL(CreatedAt, GETDATE()) as Timestamp
            FROM CoordinatorNotes;
        END
        
        -- Drop old table
        DROP TABLE CoordinatorNotes;
        
        -- Rename new table
        EXEC sp_rename 'CoordinatorNotes_New', 'CoordinatorNotes';
        
        PRINT '[√] CoordinatorNotes table structure updated';
    END
    ELSE
    BEGIN
        PRINT '[√] CoordinatorNotes table already has correct structure';
    END
END
GO

-- ====================================
-- Create system_001 user if not exists
-- ====================================

IF NOT EXISTS (SELECT * FROM Users WHERE ID = 'system_001')
BEGIN
    INSERT INTO Users (ID, Username, Email, FullName, Role, PasswordHash, IsActive, CreatedAt)
    VALUES (
        'system_001',
        'system',
        'system@fieldservice.com',
        'System',
        'Admin',
        'system_account_no_login',
        1,
        GETDATE()
    );
    PRINT '[√] Created system_001 user for automated tasks';
END
ELSE
BEGIN
    PRINT '[√] system_001 user already exists';
END
GO

-- ====================================
-- Update Performance Indexes
-- ====================================

-- Add missing indexes if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_Timestamp' AND object_id = OBJECT_ID('ActivityLog'))
BEGIN
    CREATE INDEX IX_ActivityLog_Timestamp ON ActivityLog(Timestamp DESC);
    PRINT '[√] Created index IX_ActivityLog_Timestamp';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_UserID' AND object_id = OBJECT_ID('ActivityLog'))
BEGIN
    CREATE INDEX IX_ActivityLog_UserID ON ActivityLog(UserID);
    PRINT '[√] Created index IX_ActivityLog_UserID';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Database Schema Update Complete!';
PRINT '========================================';
PRINT '';
PRINT 'New features added:';
PRINT '  • Service Requests table (public submissions)';
PRINT '  • Attachments table (file uploads)';
PRINT '  • Activity Log timezone support';
PRINT '  • Enhanced table structures';
PRINT '  • Performance indexes';
PRINT '';
PRINT 'Your existing data has been preserved.';
PRINT '========================================';
GO
