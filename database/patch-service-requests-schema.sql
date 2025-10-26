-- Patch: Align dbo.ServiceRequests schema with portal API expectations
-- Safe to run multiple times (idempotent)
SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Ensure table exists (create with expected schema if missing)
    IF NOT EXISTS (
        SELECT 1 FROM sys.tables 
        WHERE name = 'ServiceRequests' AND schema_id = SCHEMA_ID('dbo')
    )
    BEGIN
        PRINT 'Creating dbo.ServiceRequests (not found)...';
        CREATE TABLE dbo.ServiceRequests (
            RequestID INT IDENTITY(1,1) PRIMARY KEY,
            CustomerName NVARCHAR(200) NOT NULL,
            ContactEmail NVARCHAR(100) NULL, -- API requires, but allow NULL to avoid failures on existing data
            ContactPhone NVARCHAR(20) NULL,
            SiteName NVARCHAR(200) NULL,
            Address NVARCHAR(500) NULL,
            IssueDescription NVARCHAR(MAX) NOT NULL,
            Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium',
            Status NVARCHAR(50) NOT NULL DEFAULT 'New',
            SubmittedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            IPAddress NVARCHAR(50) NULL,
            UserAgent NVARCHAR(500) NULL,
            CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT'
        );

        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes WHERE name = 'IX_ServiceRequests_Status' AND object_id = OBJECT_ID('dbo.ServiceRequests')
        )
            CREATE INDEX IX_ServiceRequests_Status ON dbo.ServiceRequests(Status);

        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes WHERE name = 'IX_ServiceRequests_SubmittedAt' AND object_id = OBJECT_ID('dbo.ServiceRequests')
        )
            CREATE INDEX IX_ServiceRequests_SubmittedAt ON dbo.ServiceRequests(SubmittedAt DESC);

        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes WHERE name = 'IX_ServiceRequests_CompanyCode' AND object_id = OBJECT_ID('dbo.ServiceRequests')
        )
            CREATE INDEX IX_ServiceRequests_CompanyCode ON dbo.ServiceRequests(CompanyCode);

        PRINT 'Created dbo.ServiceRequests with expected schema.';
    END
    ELSE
    BEGIN
        PRINT 'Patching dbo.ServiceRequests columns if missing...';

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceRequests') AND name = 'ContactEmail'
        )
            ALTER TABLE dbo.ServiceRequests ADD ContactEmail NVARCHAR(100) NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceRequests') AND name = 'ContactPhone'
        )
            ALTER TABLE dbo.ServiceRequests ADD ContactPhone NVARCHAR(20) NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceRequests') AND name = 'Address'
        )
            ALTER TABLE dbo.ServiceRequests ADD Address NVARCHAR(500) NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceRequests') AND name = 'IPAddress'
        )
            ALTER TABLE dbo.ServiceRequests ADD IPAddress NVARCHAR(50) NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceRequests') AND name = 'UserAgent'
        )
            ALTER TABLE dbo.ServiceRequests ADD UserAgent NVARCHAR(500) NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceRequests') AND name = 'CompanyCode'
        )
        BEGIN
            ALTER TABLE dbo.ServiceRequests 
                ADD CompanyCode VARCHAR(8) NOT NULL CONSTRAINT DF_ServiceRequests_CompanyCode DEFAULT 'DEFAULT';

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes WHERE name = 'IX_ServiceRequests_CompanyCode' AND object_id = OBJECT_ID('dbo.ServiceRequests')
            )
                CREATE INDEX IX_ServiceRequests_CompanyCode ON dbo.ServiceRequests(CompanyCode);
        END

        PRINT 'Copying data from legacy columns if present...';
        -- Map legacy names to new names when present
        IF EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceRequests') AND name = 'CustomerEmail'
        )
        BEGIN
            -- Use dynamic SQL to avoid compile-time errors if column was just added in this batch
            EXEC sp_executesql N'
                UPDATE SR SET ContactEmail = COALESCE(SR.ContactEmail, SR.CustomerEmail)
                FROM dbo.ServiceRequests SR
                WHERE SR.ContactEmail IS NULL AND SR.CustomerEmail IS NOT NULL;
            ';
        END

        IF EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceRequests') AND name = 'CustomerPhone'
        )
        BEGIN
            EXEC sp_executesql N'
                UPDATE SR SET ContactPhone = COALESCE(SR.ContactPhone, SR.CustomerPhone)
                FROM dbo.ServiceRequests SR
                WHERE SR.ContactPhone IS NULL AND SR.CustomerPhone IS NOT NULL;
            ';
        END

        IF EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceRequests') AND name = 'SiteAddress'
        )
        BEGIN
            EXEC sp_executesql N'
                UPDATE SR SET Address = COALESCE(SR.Address, SR.SiteAddress)
                FROM dbo.ServiceRequests SR
                WHERE SR.Address IS NULL AND SR.SiteAddress IS NOT NULL;
            ';
        END
    END

    COMMIT TRANSACTION;
    PRINT 'ServiceRequests schema patch completed successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;

    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrNum INT = ERROR_NUMBER();
    DECLARE @ErrSev INT = ERROR_SEVERITY();
    DECLARE @ErrState INT = ERROR_STATE();
    DECLARE @ErrLine INT = ERROR_LINE();

    RAISERROR('ServiceRequests schema patch failed (%d, severity %d, state %d) at line %d: %s',
              @ErrSev, 1, @ErrNum, @ErrSev, @ErrState, @ErrLine, @ErrMsg);
END CATCH;
