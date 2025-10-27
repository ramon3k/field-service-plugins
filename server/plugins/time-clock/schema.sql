-- =============================================
-- Time Clock Plugin Database Schema
-- Tracks technician clock in/out times
-- =============================================

USE FieldServiceDB;
GO

-- =============================================
-- Table: TimeClockEntries
-- Stores clock in/out records for technicians
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TimeClockEntries')
BEGIN
    CREATE TABLE TimeClockEntries (
        EntryID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyCode NVARCHAR(50) NOT NULL,
        TechnicianID NVARCHAR(100) NOT NULL,
        TechnicianName NVARCHAR(200),
        ClockInTime DATETIME2 NOT NULL,
        ClockOutTime DATETIME2 NULL,
        TotalHours DECIMAL(5,2) NULL, -- Calculated when clocked out
        Notes NVARCHAR(MAX),
        Location NVARCHAR(500), -- Optional GPS coordinates or location name
        ClockInMethod NVARCHAR(50) DEFAULT 'Manual', -- 'Manual', 'GPS', 'Beacon'
        ClockOutMethod NVARCHAR(50),
        Status NVARCHAR(20) DEFAULT 'Active', -- 'Active', 'Completed', 'Edited'
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_TimeClockEntries_Company FOREIGN KEY (CompanyCode) 
            REFERENCES Companies(CompanyCode) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_TimeClockEntries_Technician ON TimeClockEntries(TechnicianID, ClockInTime DESC);
    CREATE INDEX IX_TimeClockEntries_Company ON TimeClockEntries(CompanyCode, ClockInTime DESC);
    CREATE INDEX IX_TimeClockEntries_Status ON TimeClockEntries(Status, CompanyCode);
    
    PRINT '✅ Created table: TimeClockEntries';
END
ELSE
    PRINT '⚠️ Table already exists: TimeClockEntries';
GO

-- =============================================
-- Table: TimeClockBreaks
-- Tracks break periods during work sessions
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TimeClockBreaks')
BEGIN
    CREATE TABLE TimeClockBreaks (
        BreakID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        EntryID UNIQUEIDENTIFIER NOT NULL,
        BreakType NVARCHAR(50) DEFAULT 'Lunch', -- 'Lunch', 'Short', 'Emergency'
        BreakStartTime DATETIME2 NOT NULL,
        BreakEndTime DATETIME2 NULL,
        BreakDuration INT NULL, -- Minutes, calculated when break ends
        Notes NVARCHAR(500),
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_TimeClockBreaks_Entry FOREIGN KEY (EntryID) 
            REFERENCES TimeClockEntries(EntryID) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_TimeClockBreaks_Entry ON TimeClockBreaks(EntryID, BreakStartTime);
    
    PRINT '✅ Created table: TimeClockBreaks';
END
ELSE
    PRINT '⚠️ Table already exists: TimeClockBreaks';
GO

PRINT '';
PRINT '========================================';
PRINT 'Time Clock Plugin Schema Complete';
PRINT '========================================';
GO
