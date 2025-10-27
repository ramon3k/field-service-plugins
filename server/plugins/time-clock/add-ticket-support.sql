-- =============================================
-- Add TicketID support to Time Clock
-- Allows tracking time clock entries per ticket
-- =============================================

USE FieldServiceDB;
GO

-- Add TicketID column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('TimeClockEntries') 
    AND name = 'TicketID'
)
BEGIN
    ALTER TABLE TimeClockEntries
    ADD TicketID NVARCHAR(50) NULL;
    
    CREATE INDEX IX_TimeClockEntries_Ticket ON TimeClockEntries(TicketID, ClockInTime DESC);
    
    PRINT '✅ Added TicketID column to TimeClockEntries';
END
ELSE
    PRINT '⚠️ TicketID column already exists in TimeClockEntries';
GO
