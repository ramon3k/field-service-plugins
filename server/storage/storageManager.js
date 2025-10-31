/**
 * Storage Manager
 * Unified interface for file storage (local or Azure Blob)
 * Automatically uses Azure Blob Storage if configured, otherwise falls back to local storage
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const azureBlobStorage = require('./azureBlobStorage');

class StorageManager {
  constructor() {
    this.useAzureBlob = false;
    this.localUploadDir = path.join(__dirname, '..', 'uploads');
    
    // Ensure local upload directory exists
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
      console.log('✓ Created local uploads directory');
    }
  }

  /**
   * Initialize storage (check Azure Blob, create container if needed)
   */
  async initialize() {
    if (azureBlobStorage.isReady()) {
      const initialized = await azureBlobStorage.initialize();
      if (initialized) {
        this.useAzureBlob = true;
        console.log('✓ Using Azure Blob Storage for file uploads');
        return;
      }
    }
    
    console.log('✓ Using local file storage for uploads');
    console.log('⚠ WARNING: Local storage is not persistent in Azure App Service');
    console.log('  Configure AZURE_STORAGE_CONNECTION_STRING for production deployments');
  }

  /**
   * Get multer configuration
   */
  getMulterConfig() {
    if (this.useAzureBlob) {
      // Use memory storage for Azure Blob uploads
      return {
        storage: multer.memoryStorage(),
        limits: {
          fileSize: 10 * 1024 * 1024 // 10MB limit
        }
      };
    } else {
      // Use disk storage for local uploads
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.localUploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 10);
          const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `${timestamp}_${randomId}_${safeName}`);
        }
      });

      return {
        storage: storage,
        limits: {
          fileSize: 10 * 1024 * 1024 // 10MB limit
        }
      };
    }
  }

  /**
   * Handle file upload after multer processing
   * @param {Object} file - Multer file object
   * @returns {Promise<{filename: string, url: string, storage: string}>}
   */
  async handleUpload(file) {
    if (this.useAzureBlob) {
      // Upload to Azure Blob Storage
      const result = await azureBlobStorage.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      return result;
    } else {
      // File already saved locally by multer
      return {
        filename: file.filename,
        url: `/uploads/${file.filename}`,
        storage: 'local'
      };
    }
  }

  /**
   * Delete a file
   * @param {string} filename - Filename to delete
   * @param {string} storageType - 'local' or 'azure-blob'
   */
  async deleteFile(filename, storageType = 'local') {
    if (storageType === 'azure-blob' && this.useAzureBlob) {
      return await azureBlobStorage.deleteFile(filename);
    } else {
      // Delete local file
      const filePath = path.join(this.localUploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    }
  }

  /**
   * Get file URL
   * @param {string} filename - Filename
   * @param {string} storageType - 'local' or 'azure-blob'
   */
  getFileUrl(filename, storageType = 'local') {
    if (storageType === 'azure-blob' && this.useAzureBlob) {
      return azureBlobStorage.getFileUrl(filename);
    } else {
      return `/uploads/${filename}`;
    }
  }

  /**
   * Check if using Azure Blob Storage
   */
  isUsingAzureBlob() {
    return this.useAzureBlob;
  }
}

module.exports = new StorageManager();
