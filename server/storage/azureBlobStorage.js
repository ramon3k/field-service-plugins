/**
 * Azure Blob Storage Module
 * Handles file uploads to Azure Blob Storage for production deployments
 */

const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AzureBlobStorage {
  constructor() {
    this.isConfigured = false;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'attachments';
    
    // Check if Azure Blob Storage is configured
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    
    if (connectionString) {
      try {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        this.isConfigured = true;
        console.log('✓ Azure Blob Storage configured');
      } catch (error) {
        console.warn('⚠ Azure Blob Storage configuration error:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.log('ℹ Azure Blob Storage not configured - using local file storage');
    }
  }

  /**
   * Initialize container (create if doesn't exist)
   */
  async initialize() {
    if (!this.isConfigured) return false;
    
    try {
      await this.containerClient.createIfNotExists({
        access: 'blob' // Public read access for attachments
      });
      console.log(`✓ Azure Blob Storage container "${this.containerName}" ready`);
      return true;
    } catch (error) {
      console.error('✗ Failed to initialize Azure Blob Storage:', error.message);
      return false;
    }
  }

  /**
   * Upload file to Azure Blob Storage
   * @param {Buffer} fileBuffer - File data
   * @param {string} originalFilename - Original filename
   * @param {string} mimetype - File MIME type
   * @returns {Promise<{filename: string, url: string}>}
   */
  async uploadFile(fileBuffer, originalFilename, mimetype) {
    if (!this.isConfigured) {
      throw new Error('Azure Blob Storage not configured');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    const ext = path.extname(originalFilename);
    const safeName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const blobName = `${timestamp}_${randomId}_${safeName}${ext}`;

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: mimetype
        }
      });

      const url = blockBlobClient.url;

      return {
        filename: blobName,
        url: url,
        storage: 'azure-blob'
      };
    } catch (error) {
      console.error('Azure Blob upload error:', error.message);
      throw new Error(`Failed to upload to Azure Blob Storage: ${error.message}`);
    }
  }

  /**
   * Delete file from Azure Blob Storage
   * @param {string} filename - Blob name to delete
   */
  async deleteFile(filename) {
    if (!this.isConfigured) {
      throw new Error('Azure Blob Storage not configured');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
      await blockBlobClient.deleteIfExists();
      return true;
    } catch (error) {
      console.error('Azure Blob delete error:', error.message);
      throw new Error(`Failed to delete from Azure Blob Storage: ${error.message}`);
    }
  }

  /**
   * Get file URL from Azure Blob Storage
   * @param {string} filename - Blob name
   * @returns {string} URL to access the file
   */
  getFileUrl(filename) {
    if (!this.isConfigured) {
      throw new Error('Azure Blob Storage not configured');
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
    return blockBlobClient.url;
  }

  /**
   * Get multer storage engine for Azure Blob Storage
   * This uses memory storage and then uploads to Azure
   */
  getMulterStorage() {
    return multer.memoryStorage();
  }

  /**
   * Check if Azure Blob Storage is configured and ready
   */
  isReady() {
    return this.isConfigured;
  }
}

module.exports = new AzureBlobStorage();
