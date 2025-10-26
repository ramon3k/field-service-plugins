-- Create Demo Database
-- This creates a complete copy of the production schema for demo purposes

-- Create the demo database
CREATE DATABASE FieldServiceDB_Demo;
GO

USE FieldServiceDB_Demo;
GO

-- Copy schema from production database
-- Users table
CREATE TABLE Users (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NULL,
    PhoneNumber NVARCHAR(50) NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'Technician',
    Vendor NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    LastLogin DATETIME2 NULL
);

-- Customers table
CREATE TABLE Customers (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID NVARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(255) NOT NULL,
    ContactName NVARCHAR(255) NULL,
    Email NVARCHAR(255) NULL,
    Phone NVARCHAR(50) NULL,
    Address NVARCHAR(500) NULL,
    City NVARCHAR(100) NULL,
    State NVARCHAR(50) NULL,
    ZipCode NVARCHAR(20) NULL,
    Status NVARCHAR(50) DEFAULT 'Active',
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Sites table
CREATE TABLE Sites (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SiteID NVARCHAR(50) NOT NULL UNIQUE,
    CustomerID NVARCHAR(50) NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Address NVARCHAR(500) NULL,
    City NVARCHAR(100) NULL,
    State NVARCHAR(50) NULL,
    ZipCode NVARCHAR(20) NULL,
    ContactName NVARCHAR(255) NULL,
    ContactPhone NVARCHAR(50) NULL,
    ContactEmail NVARCHAR(255) NULL,
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

-- Tickets table
CREATE TABLE Tickets (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TicketID NVARCHAR(50) NOT NULL UNIQUE,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Customer NVARCHAR(255) NULL,
    Site NVARCHAR(255) NULL,
    LicenseIDs NVARCHAR(MAX) NULL,
    Priority NVARCHAR(50) DEFAULT 'Normal',
    Status NVARCHAR(50) DEFAULT 'New',
    AssignedTo NVARCHAR(255) NULL,
    Owner NVARCHAR(255) NULL,
    Category NVARCHAR(100) DEFAULT 'General',
    ScheduledStart DATETIME2 NULL,
    ScheduledEnd DATETIME2 NULL,
    SLA_Due DATETIME2 NULL,
    Tags NVARCHAR(500) NULL,
    Resolution NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Licenses table
CREATE TABLE Licenses (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    LicenseID NVARCHAR(50) NOT NULL UNIQUE,
    CustomerID NVARCHAR(50) NOT NULL,
    SiteID NVARCHAR(50) NULL,
    LicenseType NVARCHAR(100) NOT NULL,
    LicenseNumber NVARCHAR(100) NOT NULL,
    IssuingAuthority NVARCHAR(255) NULL,
    IssueDate DATE NULL,
    ExpirationDate DATE NULL,
    Status NVARCHAR(50) DEFAULT 'Active',
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Notes table
CREATE TABLE Notes (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TicketID NVARCHAR(50) NOT NULL,
    NoteText NVARCHAR(MAX) NOT NULL,
    CreatedBy NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID)
);

-- ActivityLog table
CREATE TABLE ActivityLog (
    ID NVARCHAR(50) PRIMARY KEY,
    UserID INT NULL,
    Username NVARCHAR(255) NOT NULL,
    Action NVARCHAR(255) NOT NULL,
    Details NVARCHAR(MAX) NULL,
    Timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    IPAddress NVARCHAR(50) NULL,
    UserAgent NVARCHAR(500) NULL
);

-- Indexes for performance
CREATE INDEX IX_Tickets_Status ON Tickets(Status);
CREATE INDEX IX_Tickets_Priority ON Tickets(Priority);
CREATE INDEX IX_Tickets_AssignedTo ON Tickets(AssignedTo);
CREATE INDEX IX_Tickets_Customer ON Tickets(Customer);
CREATE INDEX IX_Sites_CustomerID ON Sites(CustomerID);
CREATE INDEX IX_Licenses_CustomerID ON Licenses(CustomerID);
CREATE INDEX IX_ActivityLog_Timestamp ON ActivityLog(Timestamp);

PRINT '✅ Demo database schema created successfully';
PRINT '📋 Next step: Run populate-demo-data.sql to add sample data';
GO
