-- ========================================
-- Field Service Database - Azure SQL Schema
-- ========================================
-- This creates all tables needed for the complete Field Service application
-- Run this in Azure Portal > FieldServiceDB > Query editor
-- Login: sqladmin / CustomerPortal2025!
--
-- After running this, you'll need to add CompanyCode columns (see add-company-code-support.sql)
-- ========================================

-- Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        ID NVARCHAR(50) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Email NVARCHAR(100) NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'Coordinator', 'Technician')),
        PasswordHash NVARCHAR(255) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        Permissions NVARCHAR(MAX), -- JSON array of permissions
        Vendor NVARCHAR(200) NULL, -- For vendor technicians
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT'
    );
    PRINT 'Users table created';
END;

-- Customers table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
BEGIN
    CREATE TABLE Customers (
        CustomerID NVARCHAR(50) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Contact NVARCHAR(100),
        Phone NVARCHAR(20),
        Email NVARCHAR(100),
        Address NVARCHAR(500),
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT'
    );
    PRINT 'Customers table created';
END;

-- Sites table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sites')
BEGIN
    CREATE TABLE Sites (
        SiteID NVARCHAR(50) PRIMARY KEY,
        CustomerID NVARCHAR(50) NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Address NVARCHAR(500),
        Contact NVARCHAR(100),
        Phone NVARCHAR(20),
        GeoLocation NVARCHAR(50), -- "lat,lng" format
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT',
        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
    );
    PRINT 'Sites table created';
END;

-- Assets table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Assets')
BEGIN
    CREATE TABLE Assets (
        AssetID NVARCHAR(50) PRIMARY KEY,
        SiteID NVARCHAR(50) NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Type NVARCHAR(100),
        Model NVARCHAR(100),
        SerialNumber NVARCHAR(100),
        InstallDate DATE,
        WarrantyExpiration DATE,
        Status NVARCHAR(50) DEFAULT 'Active',
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT',
        FOREIGN KEY (SiteID) REFERENCES Sites(SiteID)
    );
    PRINT 'Assets table created';
END;

-- Vendors table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vendors')
BEGIN
    CREATE TABLE Vendors (
        VendorID NVARCHAR(50) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Contact NVARCHAR(100),
        Phone NVARCHAR(20),
        Email NVARCHAR(100),
        ServiceAreas NVARCHAR(MAX), -- JSON array
        Specialties NVARCHAR(MAX), -- JSON array
        Rating DECIMAL(3,2),
        ServicesTexas BIT DEFAULT 0,
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT'
    );
    PRINT 'Vendors table created';
END;

-- Licenses table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Licenses')
BEGIN
    CREATE TABLE Licenses (
        LicenseID NVARCHAR(50) PRIMARY KEY,
        Customer NVARCHAR(200) NOT NULL,
        Site NVARCHAR(200) NOT NULL,
        SoftwareName NVARCHAR(200) NOT NULL,
        SoftwareVersion NVARCHAR(100),
        LicenseType NVARCHAR(50) DEFAULT 'Subscription',
        LicenseKey NVARCHAR(500),
        LicenseCount INT DEFAULT 1,
        UsedCount INT DEFAULT 0,
        ExpirationDate DATE,
        ServicePlan NVARCHAR(100),
        ServicePlanExpiration DATE,
        Vendor NVARCHAR(200),
        PurchaseDate DATE,
        PurchasePrice DECIMAL(10,2) DEFAULT 0,
        RenewalDate DATE,
        RenewalPrice DECIMAL(10,2) DEFAULT 0,
        ContactEmail NVARCHAR(100),
        Status NVARCHAR(50) DEFAULT 'Active',
        InstallationPath NVARCHAR(500),
        LastUpdated DATETIME2 DEFAULT GETUTCDATE(),
        ComplianceNotes NVARCHAR(MAX),
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT'
    );
    PRINT 'Licenses table created';
END;

-- Tickets table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tickets')
BEGIN
    CREATE TABLE Tickets (
        TicketID NVARCHAR(50) PRIMARY KEY,
        Title NVARCHAR(300) NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'New' CHECK (Status IN ('New', 'Scheduled', 'In-Progress', 'On-Hold', 'Complete', 'Closed')),
        Priority NVARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (Priority IN ('Low', 'Normal', 'High', 'Critical')),
        Customer NVARCHAR(200) NOT NULL,
        Site NVARCHAR(200) NOT NULL,
        AssetIDs NVARCHAR(MAX),
        LicenseIDs NVARCHAR(MAX),
        Category NVARCHAR(100),
        Description NVARCHAR(MAX) NOT NULL,
        ScheduledStart DATETIME2,
        ScheduledEnd DATETIME2,
        AssignedTo NVARCHAR(200),
        Owner NVARCHAR(100) DEFAULT 'Operations Coordinator',
        SLA_Due DATETIME2,
        Resolution NVARCHAR(MAX),
        ClosedBy NVARCHAR(100),
        ClosedDate DATETIME2,
        GeoLocation NVARCHAR(50),
        Tags NVARCHAR(500),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT'
    );
    PRINT 'Tickets table created';
END;

-- CoordinatorNotes table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CoordinatorNotes')
BEGIN
    CREATE TABLE CoordinatorNotes (
        NoteID NVARCHAR(50) PRIMARY KEY,
        TicketID NVARCHAR(50) NOT NULL,
        Note NVARCHAR(MAX) NOT NULL,
        CreatedBy NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID) ON DELETE CASCADE
    );
    PRINT 'CoordinatorNotes table created';
END;

-- AuditTrail table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditTrail')
BEGIN
    CREATE TABLE AuditTrail (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        TicketID NVARCHAR(50) NOT NULL,
        AuditID NVARCHAR(50) NOT NULL,
        Timestamp DATETIME2 NOT NULL,
        UserName NVARCHAR(100) NOT NULL,
        Action NVARCHAR(200) NOT NULL,
        Field NVARCHAR(100),
        OldValue NVARCHAR(MAX),
        NewValue NVARCHAR(MAX),
        Notes NVARCHAR(MAX),
        FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID)
    );
    PRINT 'AuditTrail table created';
END;

-- ServiceRequests table (already exists, but adding if missing)
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
        UserAgent NVARCHAR(500),
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT'
    );
    PRINT 'ServiceRequests table created';
END;

-- ActivityLog table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLog')
BEGIN
    CREATE TABLE ActivityLog (
        ID NVARCHAR(50) PRIMARY KEY,
        UserID NVARCHAR(50) NOT NULL,
        Username NVARCHAR(100) NOT NULL,
        Action NVARCHAR(200) NOT NULL,
        Details NVARCHAR(MAX),
        Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UserTimezone NVARCHAR(100),
        IPAddress NVARCHAR(50),
        UserAgent NVARCHAR(500),
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT'
    );
    PRINT 'ActivityLog table created';
END;

-- Attachments table
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
        CompanyCode VARCHAR(8) NOT NULL DEFAULT 'KIT',
        CONSTRAINT FK_Attachments_Ticket FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID) ON DELETE CASCADE
    );
    PRINT 'Attachments table created';
END;

-- Create Performance Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_Status' AND object_id = OBJECT_ID('Tickets'))
    CREATE INDEX IX_Tickets_Status ON Tickets(Status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_Priority' AND object_id = OBJECT_ID('Tickets'))
    CREATE INDEX IX_Tickets_Priority ON Tickets(Priority);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_AssignedTo' AND object_id = OBJECT_ID('Tickets'))
    CREATE INDEX IX_Tickets_AssignedTo ON Tickets(AssignedTo);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_Customer' AND object_id = OBJECT_ID('Tickets'))
    CREATE INDEX IX_Tickets_Customer ON Tickets(Customer);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_CreatedAt' AND object_id = OBJECT_ID('Tickets'))
    CREATE INDEX IX_Tickets_CreatedAt ON Tickets(CreatedAt);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_CompanyCode' AND object_id = OBJECT_ID('Tickets'))
    CREATE INDEX IX_Tickets_CompanyCode ON Tickets(CompanyCode);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ServiceRequests_Status' AND object_id = OBJECT_ID('ServiceRequests'))
    CREATE INDEX IX_ServiceRequests_Status ON ServiceRequests(Status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ServiceRequests_SubmittedAt' AND object_id = OBJECT_ID('ServiceRequests'))
    CREATE INDEX IX_ServiceRequests_SubmittedAt ON ServiceRequests(SubmittedAt DESC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ServiceRequests_CompanyCode' AND object_id = OBJECT_ID('ServiceRequests'))
    CREATE INDEX IX_ServiceRequests_CompanyCode ON ServiceRequests(CompanyCode);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_Timestamp' AND object_id = OBJECT_ID('ActivityLog'))
    CREATE INDEX IX_ActivityLog_Timestamp ON ActivityLog(Timestamp DESC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_UserID' AND object_id = OBJECT_ID('ActivityLog'))
    CREATE INDEX IX_ActivityLog_UserID ON ActivityLog(UserID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_CompanyCode' AND object_id = OBJECT_ID('ActivityLog'))
    CREATE INDEX IX_ActivityLog_CompanyCode ON ActivityLog(CompanyCode);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Attachments_TicketID' AND object_id = OBJECT_ID('Attachments'))
    CREATE INDEX IX_Attachments_TicketID ON Attachments(TicketID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Attachments_UploadedAt' AND object_id = OBJECT_ID('Attachments'))
    CREATE INDEX IX_Attachments_UploadedAt ON Attachments(UploadedAt DESC);

PRINT '========================================';
PRINT 'Azure SQL schema created successfully!';
PRINT '========================================';
PRINT 'Tables created:';
PRINT '  - Users';
PRINT '  - Customers';
PRINT '  - Sites';
PRINT '  - Assets';
PRINT '  - Vendors';
PRINT '  - Licenses';
PRINT '  - Tickets';
PRINT '  - CoordinatorNotes';
PRINT '  - AuditTrail';
PRINT '  - ServiceRequests';
PRINT '  - ActivityLog';
PRINT '  - Attachments';
PRINT '========================================';
PRINT 'NOTE: Tables are created empty (no data).';
PRINT 'To import data from local SQL, use SSMS Export/Import.';
PRINT '========================================';
