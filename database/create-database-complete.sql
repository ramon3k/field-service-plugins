-- Field Service Database Schema - Complete Version
-- SQL Server Express 2019
-- Includes all tables for full application functionality

-- Create the database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FieldServiceDB')
BEGIN
    CREATE DATABASE FieldServiceDB;
    PRINT 'Database FieldServiceDB created successfully!';
END
ELSE
BEGIN
    PRINT 'Database FieldServiceDB already exists.';
END
GO

USE FieldServiceDB;
GO

-- ====================================
-- Core Tables
-- ====================================

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
        Vendor NVARCHAR(200) NULL  -- For vendor technicians
    );
    PRINT 'Users table created';
END
GO

-- Companies table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Companies')
BEGIN
    CREATE TABLE Companies (
        CompanyID INT IDENTITY(1,1) PRIMARY KEY,
        CompanyCode NVARCHAR(50) NOT NULL UNIQUE,
        CompanyName NVARCHAR(255) NOT NULL,
        DisplayName NVARCHAR(255),
        ContactEmail NVARCHAR(255),
        ContactPhone NVARCHAR(50),
        Address NVARCHAR(500),
        IsActive BIT DEFAULT 1,
        AllowServiceRequests BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT 'Companies table created';
END
GO

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
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Customers table created';
END
GO

-- Sites table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sites')
BEGIN
    CREATE TABLE Sites (
        SiteID NVARCHAR(50) PRIMARY KEY,
        CustomerID NVARCHAR(50) NOT NULL,
        Name NVARCHAR(200) NOT NULL,  -- Site name
        Address NVARCHAR(500),
        Contact NVARCHAR(100),
        Phone NVARCHAR(20),
        GeoLocation NVARCHAR(50), -- "lat,lng" format
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
    );
    PRINT 'Sites table created';
END
GO

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
        FOREIGN KEY (SiteID) REFERENCES Sites(SiteID)
    );
    PRINT 'Assets table created';
END
GO

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
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Vendors table created';
END
GO

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
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT 'Licenses table created';
END
GO

-- ====================================
-- Ticketing System Tables
-- ====================================

-- Tickets table (main table)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tickets')
BEGIN
    CREATE TABLE Tickets (
        TicketID NVARCHAR(50) PRIMARY KEY,
        Title NVARCHAR(300) NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'New' CHECK (Status IN ('New', 'Scheduled', 'In-Progress', 'On-Hold', 'Complete', 'Closed')),
        Priority NVARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (Priority IN ('Low', 'Normal', 'High', 'Critical')),
        Customer NVARCHAR(200) NOT NULL,
        Site NVARCHAR(200) NOT NULL,
        AssetIDs NVARCHAR(MAX), -- Comma-separated asset IDs
        LicenseIDs NVARCHAR(MAX), -- Comma-separated license IDs
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
        GeoLocation NVARCHAR(50), -- "lat,lng" format
        Tags NVARCHAR(500), -- Comma-separated tags
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tickets table created';
END
GO

-- Coordinator Notes table
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
END
GO

-- Audit Trail table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditTrail')
BEGIN
    CREATE TABLE AuditTrail (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        TicketID NVARCHAR(50) NOT NULL,
        AuditID NVARCHAR(50) NOT NULL, -- Original audit entry ID from JSON
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
END
GO

-- ====================================
-- Service Request System Tables
-- ====================================

-- Service Requests table (for public submissions)
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
        TicketID NVARCHAR(50), -- Reference to created ticket if converted
        IPAddress NVARCHAR(50),
        UserAgent NVARCHAR(500)
    );
    PRINT 'ServiceRequests table created';
END
GO

-- ====================================
-- Activity and Logging Tables
-- ====================================

-- Activity Log table (enhanced with timezone support)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLog')
BEGIN
    CREATE TABLE ActivityLog (
        ID NVARCHAR(50) PRIMARY KEY,
        UserID NVARCHAR(50) NOT NULL,
        Username NVARCHAR(100) NOT NULL,
        Action NVARCHAR(200) NOT NULL,
        Details NVARCHAR(MAX),
        Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UserTimezone NVARCHAR(100), -- User's timezone (e.g., 'America/Chicago')
        IPAddress NVARCHAR(50),
        UserAgent NVARCHAR(500),
        FOREIGN KEY (UserID) REFERENCES Users(ID)
    );
    PRINT 'ActivityLog table created';
END
ELSE
BEGIN
    -- Add UserTimezone column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ActivityLog') AND name = 'UserTimezone')
    BEGIN
        ALTER TABLE ActivityLog ADD UserTimezone NVARCHAR(100);
        PRINT 'Added UserTimezone column to ActivityLog';
    END
END
GO

-- ====================================
-- Attachment System Tables
-- ====================================

-- Attachments table (for ticket file uploads)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Attachments')
BEGIN
    CREATE TABLE Attachments (
        AttachmentID NVARCHAR(50) PRIMARY KEY,
        TicketID NVARCHAR(50) NOT NULL,
        FileName NVARCHAR(255) NOT NULL,  -- Sanitized filename for storage
        OriginalFileName NVARCHAR(255) NOT NULL,  -- Original filename from user
        FileType NVARCHAR(100) NOT NULL,  -- MIME type (image/jpeg, application/pdf, etc.)
        FileSize INT NOT NULL,  -- Size in bytes
        FilePath NVARCHAR(500) NOT NULL,  -- Relative path to file
        UploadedBy NVARCHAR(50) NOT NULL,  -- User ID who uploaded
        UploadedAt DATETIME NOT NULL DEFAULT GETDATE(),
        Description NVARCHAR(500) NULL,  -- Optional user description
        CONSTRAINT FK_Attachments_Ticket FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID) ON DELETE CASCADE,
        CONSTRAINT FK_Attachments_User FOREIGN KEY (UploadedBy) REFERENCES Users(ID)
    );
    
    -- Indexes for faster queries
    CREATE INDEX IX_Attachments_TicketID ON Attachments(TicketID);
    CREATE INDEX IX_Attachments_UploadedAt ON Attachments(UploadedAt DESC);
    
    PRINT 'Attachments table created';
END
GO

-- ====================================
-- Create Performance Indexes
-- ====================================

-- Tickets indexes
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

-- Service Requests indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ServiceRequests_Status' AND object_id = OBJECT_ID('ServiceRequests'))
    CREATE INDEX IX_ServiceRequests_Status ON ServiceRequests(Status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ServiceRequests_SubmittedAt' AND object_id = OBJECT_ID('ServiceRequests'))
    CREATE INDEX IX_ServiceRequests_SubmittedAt ON ServiceRequests(SubmittedAt DESC);

-- Activity Log indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_Timestamp' AND object_id = OBJECT_ID('ActivityLog'))
    CREATE INDEX IX_ActivityLog_Timestamp ON ActivityLog(Timestamp DESC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_UserID' AND object_id = OBJECT_ID('ActivityLog'))
    CREATE INDEX IX_ActivityLog_UserID ON ActivityLog(UserID);

PRINT 'Performance indexes created successfully!';
GO

PRINT '========================================';
PRINT 'Database schema created successfully!';
PRINT 'Database: FieldServiceDB';
PRINT '========================================';
PRINT 'Tables created:';
PRINT '  - Users (with vendor support)';
PRINT '  - Companies (multi-company support)';
PRINT '  - Customers';
PRINT '  - Sites';
PRINT '  - Assets';
PRINT '  - Vendors';
PRINT '  - Licenses';
PRINT '  - Tickets';
PRINT '  - CoordinatorNotes';
PRINT '  - AuditTrail';
PRINT '  - ServiceRequests (public submission)';
PRINT '  - ActivityLog (with timezone support)';
PRINT '  - Attachments (file uploads)';
PRINT '  - GlobalPlugins (plugin registry)';
PRINT '  - PluginAPIEndpoints (plugin API routes)';
PRINT '  - SystemHooks (system extension points)';
PRINT '  - PluginHookRegistrations (plugin hook handlers)';
PRINT '  - PluginMenuItems (plugin UI menu items)';
PRINT '  - PluginDatabaseObjects (plugin schema tracking)';
PRINT '  - PluginActivityLog (plugin usage tracking)';
PRINT '  - TenantPluginInstallations (plugin installations)';
PRINT '========================================';
GO

-- ====================================
-- Plugin System Tables
-- ====================================

-- GlobalPlugins table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GlobalPlugins')
BEGIN
    CREATE TABLE GlobalPlugins (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        displayName NVARCHAR(200) NOT NULL,
        description NVARCHAR(1000),
        version NVARCHAR(20) NOT NULL,
        author NVARCHAR(100),
        authorEmail NVARCHAR(255),
        category NVARCHAR(50),
        tags NVARCHAR(500),
        packagePath NVARCHAR(500),
        mainFile NVARCHAR(255),
        manifestFile NVARCHAR(255),
        minAppVersion NVARCHAR(20),
        maxAppVersion NVARCHAR(20),
        dependencies NVARCHAR(1000),
        hasDatabase BIT,
        hasAPI BIT,
        hasUI BIT,
        hasHooks BIT,
        requiredPermissions NVARCHAR(500),
        securityLevel NVARCHAR(20),
        status NVARCHAR(20),
        isOfficial BIT,
        createdAt DATETIME2,
        updatedAt DATETIME2
    );
    PRINT 'GlobalPlugins table created';
END
GO

-- PluginAPIEndpoints table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginAPIEndpoints')
BEGIN
    CREATE TABLE PluginAPIEndpoints (
        EndpointID INT IDENTITY(1,1) PRIMARY KEY,
        PluginID UNIQUEIDENTIFIER NOT NULL,
        Method NVARCHAR(10) NOT NULL,
        Path NVARCHAR(500) NOT NULL,
        Description NVARCHAR(MAX),
        RequiresAuth BIT DEFAULT 1,
        RequiresRole NVARCHAR(50),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_PluginEndpoints_Plugin FOREIGN KEY (PluginID) 
            REFERENCES GlobalPlugins(id) ON DELETE CASCADE
    );
    PRINT 'PluginAPIEndpoints table created';
END
GO

-- SystemHooks table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemHooks')
BEGIN
    CREATE TABLE SystemHooks (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        displayName NVARCHAR(200) NOT NULL,
        description NVARCHAR(500),
        hookType NVARCHAR(50) NOT NULL,
        category NVARCHAR(50),
        parameters NVARCHAR(1000),
        returnType NVARCHAR(100),
        triggerContext NVARCHAR(200),
        isAsync BIT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETUTCDATE()
    );
    PRINT 'SystemHooks table created';
END
GO

-- PluginHookRegistrations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginHookRegistrations')
BEGIN
    CREATE TABLE PluginHookRegistrations (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER NOT NULL,
        hookId UNIQUEIDENTIFIER NOT NULL,
        handlerFunction NVARCHAR(255) NOT NULL,
        priority INT DEFAULT 10,
        isEnabled BIT DEFAULT 1,
        executionCount INT DEFAULT 0,
        totalExecutionTime BIGINT DEFAULT 0,
        lastExecuted DATETIME2,
        lastError NVARCHAR(1000),
        registeredAt DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_PluginHookReg_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE CASCADE,
        CONSTRAINT FK_PluginHookReg_Hook FOREIGN KEY (hookId) 
            REFERENCES SystemHooks(id) ON DELETE CASCADE
    );
    PRINT 'PluginHookRegistrations table created';
END
GO

-- PluginMenuItems table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginMenuItems')
BEGIN
    CREATE TABLE PluginMenuItems (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER NOT NULL,
        label NVARCHAR(100) NOT NULL,
        icon NVARCHAR(100),
        route NVARCHAR(255),
        component NVARCHAR(255),
        parentMenu NVARCHAR(100),
        sortOrder INT DEFAULT 100,
        requiredRole NVARCHAR(50),
        requiredPermissions NVARCHAR(500),
        isEnabled BIT DEFAULT 1,
        isVisible BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_PluginMenu_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE CASCADE
    );
    PRINT 'PluginMenuItems table created';
END
GO

-- PluginDatabaseObjects table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginDatabaseObjects')
BEGIN
    CREATE TABLE PluginDatabaseObjects (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER NOT NULL,
        objectType NVARCHAR(50) NOT NULL,
        objectName NVARCHAR(255) NOT NULL,
        schemaName NVARCHAR(100) DEFAULT 'dbo',
        creationScript NVARCHAR(MAX),
        rollbackScript NVARCHAR(MAX),
        dependsOn NVARCHAR(1000),
        requiredBy NVARCHAR(1000),
        isCreated BIT DEFAULT 0,
        createdAt DATETIME2,
        lastModified DATETIME2,
        CONSTRAINT FK_PluginDBObj_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE CASCADE
    );
    PRINT 'PluginDatabaseObjects table created';
END
GO

-- PluginActivityLog table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginActivityLog')
BEGIN
    CREATE TABLE PluginActivityLog (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER,
        activity NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        userId NVARCHAR(100),
        userRole NVARCHAR(50),
        ipAddress NVARCHAR(45),
        userAgent NVARCHAR(500),
        metadata NVARCHAR(MAX),
        timestamp DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_PluginActivity_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE SET NULL
    );
    PRINT 'PluginActivityLog table created';
END
GO

-- TenantPluginInstallations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TenantPluginInstallations')
BEGIN
    CREATE TABLE TenantPluginInstallations (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        tenantId NVARCHAR(50) NOT NULL,
        pluginId UNIQUEIDENTIFIER NOT NULL,
        installedVersion NVARCHAR(20) NOT NULL,
        installedAt DATETIME2 DEFAULT GETUTCDATE(),
        installedBy NVARCHAR(100),
        isEnabled BIT DEFAULT 1,
        isConfigured BIT DEFAULT 0,
        configuration NVARCHAR(MAX),
        customSettings NVARCHAR(MAX),
        lastActivated DATETIME2,
        lastDeactivated DATETIME2,
        activationCount INT DEFAULT 0,
        status NVARCHAR(20) DEFAULT 'installed',
        errorMessage NVARCHAR(1000),
        updatedAt DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_TenantPlugin_Plugin FOREIGN KEY (pluginId) 
            REFERENCES GlobalPlugins(id) ON DELETE CASCADE
    );
    PRINT 'TenantPluginInstallations table created';
END
GO

