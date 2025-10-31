# API Integration Instructions for Azure Blob Storage

## Changes Required in server/api.cjs

### 1. Add Storage Manager Import (near top of file, after other requires)

```javascript
const storageManager = require('./storage/storageManager');
```

### 2. Replace the multer upload configuration (around line 50-72)

**REPLACE THIS:**
```javascript
// Ensure uploads directory exists for attachments
const uploadDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at', uploadDir);
  }
} catch (e) {
  console.warn('Could not create uploads directory:', e && e.message);
}

// Multer storage configuration for attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${randomId}_${safeName}`);
  }
});

const upload = multer({ storage });
```

**WITH THIS:**
```javascript
// Storage manager will be initialized after database connection
let upload = null;

// Initialize storage manager (called after database is ready)
async function initializeStorage() {
  await storageManager.initialize();
  const multerConfig = storageManager.getMulterConfig();
  upload = multer(multerConfig);
  console.log('✓ File upload middleware configured');
}
```

### 3. Call initializeStorage() after database connection (around line 90-100)

**ADD THIS after database pool is created:**
```javascript
// After this line:
console.log('Connected to SQL Server');

// ADD:
await initializeStorage();
```

### 4. Update the attachment upload endpoint (around line 2525)

**REPLACE THIS:**
```javascript
// Upload attachment for a ticket
app.post('/api/tickets/:ticketId/attachments', upload.single('file'), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const file = req.file;
    const description = req.body.description || '';
    const uploadedBy = req.headers['x-user-id'] || req.headers['x-user-name'] || 'unknown';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Build attachment metadata
    const attachmentId = `ATT-${Date.now()}-${Math.random().toString(36).substr(2,8)}`;
    const filePath = path.relative(__dirname, file.path).replace(/\\/g, '/');
```

**WITH THIS:**
```javascript
// Upload attachment for a ticket
app.post('/api/tickets/:ticketId/attachments', upload.single('file'), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const file = req.file;
    const description = req.body.description || '';
    const uploadedBy = req.headers['x-user-id'] || req.headers['x-user-name'] || 'unknown';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Handle file upload (local or Azure Blob)
    const uploadResult = await storageManager.handleUpload(file);

    // Build attachment metadata
    const attachmentId = `ATT-${Date.now()}-${Math.random().toString(36).substr(2,8)}`;
    const filePath = uploadResult.url; // URL for accessing the file
    const fileName = uploadResult.filename;
    const storageType = uploadResult.storage; // 'local' or 'azure-blob'
```

### 5. Update the database insert to include storage type (same endpoint)

**FIND THIS:**
```javascript
.query(`
  INSERT INTO Attachments (AttachmentID, TicketID, FileName, OriginalFileName, FileType, FileSize, FilePath, UploadedBy, Description, UploadedAt, CompanyCode)
  VALUES (@attachmentId, @ticketId, @fileName, @originalFileName, @fileType, @fileSize, @filePath, @uploadedBy, @description, GETDATE(), @companyCode)
`);
```

**REPLACE WITH:**
```javascript
.input('storageType', sql.VarChar, storageType)
.query(`
  INSERT INTO Attachments (AttachmentID, TicketID, FileName, OriginalFileName, FileType, FileSize, FilePath, UploadedBy, Description, UploadedAt, CompanyCode, StorageType)
  VALUES (@attachmentId, @ticketId, @fileName, @originalFileName, @fileType, @fileSize, @filePath, @uploadedBy, @description, GETDATE(), @companyCode, @storageType)
`);
```

### 6. Update the .input for fileName (same endpoint)

**FIND THIS:**
```javascript
.input('fileName', sql.NVarChar, file.filename)
```

**REPLACE WITH:**
```javascript
.input('fileName', sql.NVarChar, fileName)
```

### 7. Update the attachment deletion endpoint (if it exists)

**FIND the delete endpoint and ADD:**
```javascript
// Delete attachment
app.delete('/api/tickets/:ticketId/attachments/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // Get attachment info before deleting
    const result = await pool.request()
      .input('attachmentId', sql.NVarChar, attachmentId)
      .query('SELECT FileName, FilePath, StorageType FROM Attachments WHERE AttachmentID = @attachmentId');
    
    if (result.recordset.length > 0) {
      const attachment = result.recordset[0];
      
      // Delete file from storage
      try {
        await storageManager.deleteFile(attachment.FileName, attachment.StorageType || 'local');
      } catch (err) {
        console.warn('File deletion failed:', err.message);
        // Continue with database deletion even if file delete fails
      }
      
      // Delete from database
      await pool.request()
        .input('attachmentId', sql.NVarChar, attachmentId)
        .query('DELETE FROM Attachments WHERE AttachmentID = @attachmentId');
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Attachment not found' });
    }
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});
```

## Database Schema Update

Add `StorageType` column to Attachments table:

```sql
-- Add StorageType column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Attachments') AND name = 'StorageType')
BEGIN
    ALTER TABLE Attachments ADD StorageType VARCHAR(20) DEFAULT 'local';
    PRINT 'Added StorageType column to Attachments table';
END
ELSE
BEGIN
    PRINT 'StorageType column already exists';
END
GO
```

## Installation

1. Install Azure Storage SDK:
```bash
cd server
npm install @azure/storage-blob uuid
```

2. Update database schema (run SQL above)

3. Apply code changes to `server/api.cjs`

4. Configure Azure Blob Storage (see AZURE-BLOB-STORAGE-SETUP.md)

5. Test file uploads
