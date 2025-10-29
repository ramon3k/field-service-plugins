-- ====================================
-- Fix GlobalPlugins Table Schema
-- This updates the existing GlobalPlugins table
-- to match the working database structure
-- ====================================

USE FieldServiceDB;
GO

PRINT '========================================';
PRINT 'Updating GlobalPlugins table schema...';
PRINT '========================================';

-- First, check if we need to update the table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GlobalPlugins') AND name = 'PluginID')
BEGIN
    PRINT 'Detected old GlobalPlugins schema - updating...';
    
    -- Drop PluginAPIEndpoints first (has FK to GlobalPlugins)
    IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PluginAPIEndpoints')
    BEGIN
        DROP TABLE PluginAPIEndpoints;
        PRINT 'Dropped PluginAPIEndpoints (will be recreated)';
    END
    
    -- Now drop the old GlobalPlugins table
    DROP TABLE GlobalPlugins;
    PRINT 'Dropped old GlobalPlugins table';
    
    -- Create the new schema
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
    
    PRINT 'GlobalPlugins table updated to new schema (25 columns)';
END
ELSE
BEGIN
    PRINT 'GlobalPlugins table already has correct schema - skipping';
END
GO

PRINT '========================================';
PRINT 'GlobalPlugins schema update complete!';
PRINT 'Now run: add-missing-plugin-tables.sql';
PRINT '========================================';
GO
