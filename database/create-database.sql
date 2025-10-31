-- Field Service Database Schema
-- SQL Server Express 2019

-- Create the database
CREATE DATABASE FieldServiceDB;
GO

USE FieldServiceDB;
GO

-- Users table
CREATE TABLE Users (
    ID NVARCHAR(50) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'Coordinator', 'Technician')),
    PasswordHash NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    Permissions NVARCHAR(MAX) -- JSON array of permissions
);

-- Customers table
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

-- Sites table
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
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

-- Assets table
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

-- Vendors table
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

-- Tickets table (main table)
CREATE TABLE Tickets (
    TicketID NVARCHAR(50) PRIMARY KEY,
    Title NVARCHAR(300) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'New' CHECK (Status IN ('New', 'Scheduled', 'In-Progress', 'On-Hold', 'Complete', 'Closed')),
    Priority NVARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (Priority IN ('Low', 'Normal', 'High', 'Critical')),
    Customer NVARCHAR(200) NOT NULL,
    Site NVARCHAR(200) NOT NULL,
    AssetIDs NVARCHAR(MAX), -- Comma-separated asset IDs
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

-- Coordinator Notes table
CREATE TABLE CoordinatorNotes (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TicketID NVARCHAR(50) NOT NULL,
    Note NVARCHAR(MAX) NOT NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID)
);

-- Audit Trail table
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

-- Create indexes for better performance
CREATE INDEX IX_Tickets_Status ON Tickets(Status);
CREATE INDEX IX_Tickets_Priority ON Tickets(Priority);
CREATE INDEX IX_Tickets_AssignedTo ON Tickets(AssignedTo);
CREATE INDEX IX_Tickets_Customer ON Tickets(Customer);
CREATE INDEX IX_Tickets_CreatedAt ON Tickets(CreatedAt);
CREATE INDEX IX_AuditTrail_TicketID ON AuditTrail(TicketID);
CREATE INDEX IX_CoordinatorNotes_TicketID ON CoordinatorNotes(TicketID);

PRINT 'Database schema created successfully!';