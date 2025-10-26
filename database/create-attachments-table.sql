-- Create Attachments table for ticket file uploads
-- Supports images, documents, and other file types

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
    
    -- Index for faster queries by ticket
    CREATE INDEX IX_Attachments_TicketID ON Attachments(TicketID);
    
    -- Index for faster queries by upload date
    CREATE INDEX IX_Attachments_UploadedAt ON Attachments(UploadedAt DESC);
    
    PRINT 'Attachments table created successfully';
END
ELSE
BEGIN
    PRINT 'Attachments table already exists';
END
GO
