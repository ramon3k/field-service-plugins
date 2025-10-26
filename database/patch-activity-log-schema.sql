-- Patch: Create or update dbo.ActivityLog for portal submission logging
-- Safe to run multiple times (idempotent)
SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (
        SELECT 1 FROM sys.tables 
        WHERE name = 'ActivityLog' AND schema_id = SCHEMA_ID('dbo')
    )
    BEGIN
        PRINT 'Creating dbo.ActivityLog (not found)...';
        CREATE TABLE dbo.ActivityLog (
            ID INT IDENTITY(1,1) PRIMARY KEY,
            UserID INT NULL,
            Username NVARCHAR(100) NULL,
            Action NVARCHAR(100) NOT NULL,
            Details NVARCHAR(MAX) NULL,
            Timestamp DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            IPAddress NVARCHAR(50) NULL,
            UserAgent NVARCHAR(500) NULL,
            CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT',
            UserTimezone NVARCHAR(100) NULL
        );

        CREATE INDEX IX_ActivityLog_Timestamp ON dbo.ActivityLog(Timestamp DESC);
        CREATE INDEX IX_ActivityLog_Username ON dbo.ActivityLog(Username);
        CREATE INDEX IX_ActivityLog_CompanyCode ON dbo.ActivityLog(CompanyCode);

        PRINT 'Created dbo.ActivityLog with expected schema.';
    END
    ELSE
    BEGIN
        PRINT 'Patching dbo.ActivityLog columns if missing...';

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ActivityLog') AND name = 'IPAddress'
        )
            ALTER TABLE dbo.ActivityLog ADD IPAddress NVARCHAR(50) NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ActivityLog') AND name = 'UserAgent'
        )
            ALTER TABLE dbo.ActivityLog ADD UserAgent NVARCHAR(500) NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ActivityLog') AND name = 'CompanyCode'
        )
        BEGIN
            ALTER TABLE dbo.ActivityLog 
                ADD CompanyCode VARCHAR(8) NOT NULL CONSTRAINT DF_ActivityLog_CompanyCode DEFAULT 'DEFAULT';

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes WHERE name = 'IX_ActivityLog_CompanyCode' AND object_id = OBJECT_ID('dbo.ActivityLog')
            )
                CREATE INDEX IX_ActivityLog_CompanyCode ON dbo.ActivityLog(CompanyCode);
        END

        IF NOT EXISTS (
            SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ActivityLog') AND name = 'UserTimezone'
        )
            ALTER TABLE dbo.ActivityLog ADD UserTimezone NVARCHAR(100) NULL;
    END

    COMMIT TRANSACTION;
    PRINT 'ActivityLog schema patch completed successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;

    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrNum INT = ERROR_NUMBER();
    DECLARE @ErrSev INT = ERROR_SEVERITY();
    DECLARE @ErrState INT = ERROR_STATE();
    DECLARE @ErrLine INT = ERROR_LINE();

    RAISERROR('ActivityLog schema patch failed (%d, severity %d, state %d) at line %d: %s',
              @ErrSev, 1, @ErrNum, @ErrSev, @ErrState, @ErrLine, @ErrMsg);
END CATCH;
